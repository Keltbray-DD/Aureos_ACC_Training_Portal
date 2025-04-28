document.addEventListener('DOMContentLoaded', async function() {
    let trainingList = await getEventDetails()
    console.log(trainingList)
    let levelDropdown = document.getElementById('levelSelect')

    levelDropdown.addEventListener("change", async (e) => {
        const level = e.target.value
        console.log(level)
        const dateDropdown = document.getElementById('levelDates')
        dateDropdown.innerHTML = ''
        switch (level) {
            case '1':
                await populateDatesDropdown(trainingList.Level1,dateDropdown)
                break;

            case '2':
                await populateDatesDropdown(trainingList.Level2,dateDropdown)
                break;
            default:
                console.log("nope")
                break;
        }
      });
})

async function populateDatesDropdown(array,htmlElement) {
    array.forEach(async element => {
        const option = document.createElement("option");
        option.value = element.id;
        //console.log(element.start)
        const date = await convertDateTimeZone(element.start)
        option.textContent = date
        htmlElement.appendChild(option)
        htmlElement.addEventListener("change", async (e) => {
            
        })
    });
    htmlElement.disabled = false
    document.getElementById('userEmail').disabled = false
}

async function convertDateTimeZone(rawUtcTimeString) {

        // Split at '.' and take the first part
        const utcTimeString = rawUtcTimeString.split('.')[0] + "Z"; 
        // (add 'Z' to make sure JavaScript treats it as UTC)
        // Create a Date object from the UTC time
        const utcDate = new Date(utcTimeString);

    // Check if the date is valid
    if (isNaN(utcDate)) {
        console.log('Invalid date format!');
      } else {
        // Convert to London time
        const londonTime = utcDate.toLocaleString('en-GB', {
          timeZone: 'Europe/London',
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });

        return londonTime
}}

async function convertDateFormat(isoDate) {
    const date = new Date(isoDate);

// Example 1: Basic friendly format
const friendly = date.toLocaleString('en-GB', {
  weekday: 'long',   // Monday
  year: 'numeric',   // 2025
  month: 'long',     // April
  day: 'numeric',    // 28
  hour: '2-digit',
  minute: '2-digit',
  hour12: true       // 2:35 PM
});

return friendly
}

async function runAddUserToEvent() {

    const eventId = document.getElementById('levelDates')
    const userEmail = document.getElementById('userEmail')
    const levelDropdown = document.getElementById('levelSelect')
    const submitBtn = document.getElementById('submitBtn')

    levelDropdown.disabled = true
    submitBtn.disabled = true
    eventId.disabled = true
    userEmail.disabled = true
    await postEventUpdate(eventId.value,userEmail.value)
    window.location.href = 'requestSuccess.html';

}

async function postEventUpdate(eventId,userEmail){

    const bodyData = {
        'eventId': eventId,
        'userEmail': userEmail
        };

    const headers = {
        'Content-Type':'application/json'
    };

    const requestOptions = {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(bodyData)
    };

    const apiUrl = "https://prod-25.uksouth.logic.azure.com:443/workflows/c90aa7165c1d4ee4b782189637e1a16e/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=pjNcqBl2cFeGxnPDdO14_pX3zOJf7QvsOuAnvPbPE_s";
    //console.log(apiUrl)
    console.log(requestOptions)
    responseData = await fetch(apiUrl,requestOptions)
        .then(response => response.json())
        .then(data => {
            const JSONdata = data
        //console.log(JSONdata)
        //console.log(JSONdata.uploadKey)
        //console.log(JSONdata.urls)
        return JSONdata
        })
        .catch(error => console.error('Error fetching data:', error));

    return responseData
    }

async function getEventDetails(){

    const headers = {
        'Content-Type':'application/json'
    };

    const requestOptions = {
        method: 'GET',
        headers: headers
    };

    const apiUrl = "https://prod-44.uksouth.logic.azure.com:443/workflows/2153356072ec47c5846c5870941fccba/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=P8I6QzglKqButVCpAcMxxZeZwwULd8UUhj-OQt8cSFY";
    //console.log(apiUrl)
    //console.log(requestOptions)
    responseData = await fetch(apiUrl,requestOptions)
        .then(response => response.json())
        .then(data => {
            const JSONdata = data
        //console.log(JSONdata)
        //console.log(JSONdata.uploadKey)
        //console.log(JSONdata.urls)
        return JSONdata
        })
        .catch(error => console.error('Error fetching data:', error));

    return responseData
    }

    function validateEmail() {
        const email = document.getElementById("userEmail").value;
        const submitButton = document.getElementById(`submitBtn`);
        const message = document.getElementById("message");
      
        // Define blocked personal email providers
        const blockedDomains = ["gmail.com", "yahoo.com", "hotmail.com", "hotmail.co.uk", "outlook.com", "aol.com", "icloud.com", "live.com", "msn.com", "protonmail.com"];
        const emailRegex = new RegExp(`^[^\\s@]+@(?!(${blockedDomains.join("|")}))[^\\s@]+\\.[^\\s@]+$`, "i");
      
        if (emailRegex.test(email)) {
            message.style.color = "green";
            message.textContent = "✅ Valid Business Email!";
            submitButton.disabled = false; // Enable button
            submitButton.classList.remove("disabled"); // Remove greyed-out style
        } else {
            message.style.color = "red";
            message.textContent = "❌ Invalid Email! Please use a business email (e.g., name@company.com).";
            submitButton.disabled = true; // Disable button
            submitButton.classList.add("disabled"); // Add greyed-out style
        }
      }