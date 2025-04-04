// script.js
const screens = {
    record: document.getElementById('recordScreen'),
    merged: document.getElementById('mergedImageSection'),
    qr: document.getElementById('qrSection')
};

const video = document.getElementById('videoPreview');
const countdownElement = document.getElementById('countdown');
const previews = [document.getElementById('preview1'), document.getElementById('preview2'), document.getElementById('preview3')];
const canvas = document.getElementById('mergedCanvas');
const qrContainer = document.getElementById('qrcode');

let currentPhotoIndex = 0;
let isCapturing = false;
let mediaStream = null;

// Initialize camera
async function initCamera() {
    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
        video.srcObject = mediaStream;
        screens.record.classList.add('active');
    } catch (error) {
        alert('Error accessing camera: ' + error.message);
    }
}

// Capture process
async function startCaptureProcess() {
    if (currentPhotoIndex >= 3 || isCapturing) return;

    isCapturing = true;
    countdownElement.style.display = 'block';
    
    let count = 1;
    countdownElement.textContent = count;

    const countdownInterval = setInterval(() => {
        count--;
        countdownElement.textContent = count;
        
        if (count <= 0) {
            clearInterval(countdownInterval);
            countdownElement.style.display = 'none';
            capturePhoto();
        }
    }, 1000);
}

function capturePhoto() {
    const tempCanvas = document.createElement('canvas');
    const context = tempCanvas.getContext('2d');
    
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    
    context.translate(tempCanvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(video, 0, 0);
    
    const dataUrl = tempCanvas.toDataURL('image/jpeg');
    previews[currentPhotoIndex].src = dataUrl;
    previews[currentPhotoIndex].style.display = 'block';
    
    currentPhotoIndex++;
    isCapturing = false;

    if (currentPhotoIndex === 3) {
        mergePhotos();
    }
}

// function mergePhotos() {
//     const imgWidth = previews[0].naturalWidth;
//     const imgHeight = previews[0].naturalHeight;
    
//     canvas.width = imgWidth * 3;
//     canvas.height = imgHeight;
    
//     const ctx = canvas.getContext('2d');
    
//     previews.forEach((img, index) => {
//         ctx.drawImage(img, imgWidth * index, 0, imgWidth, imgHeight);
//     });

//     const mergedImage = canvas.toDataURL('image/jpeg');
//     showQRCode(mergedImage);
// }


function mergePhotos() {
    const images = previews.map(preview => {
        return new Promise(resolve => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.src = preview.src;
        });
    });

    Promise.all(images).then(loadedImages => {
        const imgWidth = loadedImages[0].naturalWidth;
        const imgHeight = loadedImages[0].naturalHeight;

        canvas.width = imgWidth * 3;
        canvas.height = imgHeight;

        const ctx = canvas.getContext('2d');

        loadedImages.forEach((img, index) => {
            ctx.drawImage(img, imgWidth * index, 0, imgWidth, imgHeight);
        });

        const mergedImage = canvas.toDataURL('image/jpeg');
        showQRCode(mergedImage);
    });
}

function showQRCode(imageData) {
    screens.record.classList.remove('active');
    screens.merged.classList.add('active');
    
    qrContainer.innerHTML = '';

    setTimeout(() => {
        screens.merged.classList.remove('active');
        screens.qr.classList.add('active');

        // Upload image to ImgBB
        const apiKey = '52733bd9da0e35a597c639cd1a9e5a1a'; // 🔁 Replace with your real key
        const base64 = imageData.split(',')[1]; // remove the data URL prefix



        const formData = new FormData();
        formData.append('image', base64);

        fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
            method: 'POST',
            body: formData // ✅ don't set Content-Type manually
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const imageUrl = data.data.url;
                console.log(imageUrl);
                new QRCode(qrContainer, {
                    text: imageUrl,
                    width: 300,
                    height: 300,
                    colorDark: '#000000',
                    colorLight: '#ffffff',
                    correctLevel: 2
                });

                qrContainer.title = "Tap to open image";
                qrContainer.style.cursor = 'pointer';
                qrContainer.onclick = () => {
                    window.open(imageUrl, '_blank');
                };
            } else {
                alert("Upload failed");
                console.error(data);
            }
        })
        .catch(error => {
            alert("Upload error");
            console.error(error);
        });

    }, 2000);
}

// Event Listeners
document.body.addEventListener('click', () => {
    if (!isCapturing && currentPhotoIndex < 3) {
        startCaptureProcess();
    }
});

// Initialize
initCamera();