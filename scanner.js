function domReady(fn) {
    if (document.readyState === "complete" || document.readyState === "interactive") {
        setTimeout(fn, 1000);
    } else {
        document.addEventListener("DOMContentLoaded", fn);
    }
}

domReady(function () {
    let scannerRunning = false;  // Flag to control scanning
    let htmlscanner = null;       // To hold the scanner instance

    // Function when QR code is successfully scanned
    function onScanSuccess(decodeText, decodeResult) {
        if (scannerRunning) {
            // Stop the scanner
            scannerRunning = false;

            // Get the selected language
            const selectedLanguage = document.getElementById('language').value;

            // Display the result in an alert box (optional, for debugging)
            alert("Your QR Code is: " + decodeText + "\nSelected Language: " + selectedLanguage);

            // Send the QR code data to the first Flask API (Gemini processing)
            fetch('/process-qr', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ qr_data: decodeText })
            })
            .then(response => response.json())  // Get the response from the first API
            .then(data => {
                const geminiResponse = data.message;

                // Send the Gemini response and selected language to the second API for translation
                fetch('/translate-response', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ response_text: geminiResponse, language: selectedLanguage })
                })
                .then(translationResponse => translationResponse.json())
                .then(translationData => {
                    // Display the translated response as a paragraph instead of alert
                    const qrResultDiv = document.getElementById('qr-result');
                    qrResultDiv.innerHTML = "<h3>Translated QR Code Response:</h3><p>" + translationData.translated_message + "</p>";
                })
                .catch(error => {
                    console.error('Error with translation:', error);
                });
            })
            .catch(error => {
                console.error('Error with Gemini API:', error);
            });

            // Restart the scanner after a delay (optional)
            setTimeout(() => {
                scannerRunning = true;  // Reset flag to enable scanning again
            }, 5000);  // Adjust the delay as needed
        }
    }

    // Initialize the scanner
    htmlscanner = new Html5QrcodeScanner(
        "my-qr-reader",
        { fps: 10, qrbos: 250 }
    );

    // Add event listener to start scanning manually
    document.getElementById('start-scanning').addEventListener('click', function() {
        if (!scannerRunning) {
            scannerRunning = true;
            htmlscanner.render(onScanSuccess);
        }
    });
});



// Image Upload

const selectImage = document.querySelector('.select-image');
const inputFile = document.querySelector('#file');
const imgArea = document.querySelector('.img-area');

selectImage.addEventListener('click', function () {
	inputFile.click();
})

inputFile.addEventListener('change', function () {
	const image = this.files[0]
	if(image.size < 2000000) {
		const reader = new FileReader();
		reader.onload = ()=> {
			const allImg = imgArea.querySelectorAll('img');
			allImg.forEach(item=> item.remove());
			const imgUrl = reader.result;
			const img = document.createElement('img');
			img.src = imgUrl;
			imgArea.appendChild(img);
			imgArea.classList.add('active');
			imgArea.dataset.img = image.name;
		}
		reader.readAsDataURL(image);
	} else {
		alert("Image size more than 2MB");
	}
})





// Medicinal Plant Identification (new functionality)
function uploadImage() {
    var formData = new FormData(document.getElementById('uploadForm'));

    // Add the selected language to the FormData
    const selectedLanguage = document.getElementById('language').value;
    formData.append('language', selectedLanguage);

    fetch('/identify', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (data.translated_message) {
            let resultDiv = document.getElementById('result');
            resultDiv.innerHTML = '<h3>Translated Plant Info: ' + data.translated_message + '</h3>';
        } else {
            alert('Could not identify or translate the plant.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error in processing the image.');
    });
}


