document.addEventListener("DOMContentLoaded", async function () {
 // Handle form submission.
  document.getElementById("submitFeedbackBtn").addEventListener("click", async function (e) {
    e.preventDefault();
    // const result = await scoreChecker(test);
    const result = true
    if(result){
      // Log the values or use them as needed.
      userName = sessionStorage.getItem('userName');
      userEmail = sessionStorage.getItem('userEmail');
      console.log("Name:", userName);
      console.log("Email:", userEmail);
      var data = {
        name: userName,
        email: userEmail,
        FBQ1: document.querySelector(`input[name="questionFB1"]:checked`).value,
        FBQ2: document.querySelector(`input[name="questionFB2"]:checked`).value,
        FBQ3: document.querySelector(`input[name="questionFB3"]:checked`).value,
        FBQ4: document.querySelector(`input[name="questionFB4"]:checked`).value,
        //FBQ5: document.querySelector(`input[name="questionFB5"]:checked`).value,
      };
      console.log(data)
    // Send the data via a POST request (adjust the endpoint URL as needed).
    await fetch(
      "https://prod-26.uksouth.logic.azure.com:443/workflows/d2a9a362586340fcaca5a40e28806571/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=XXJMTf-qkvFpkPUHhqtMYEBdbSce4QGgJYTMRIb0c0o",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    )
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        } else {
          // Display success message.
          console.log('Feedback Submitted')
          window.location.href = 'confirmation.html';
        }
        return response.json();
      })
      .then(function (responseData) {
        
      })
      .catch(function (error) {
        document.getElementById("message").textContent =
          "Submission failed. Please try again.";
        console.error("Error:", error);
      });

    }
    return;
  });

  document.getElementById("skipFeedbackBtn").addEventListener("click", async function (e) {
    e.preventDefault();
    console.log('Feedback Skipped')
    window.location.href = 'confirmation.html';
    return;
  });
});