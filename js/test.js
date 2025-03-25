document.addEventListener("DOMContentLoaded", async function () {
  let projectDropdown = document.getElementById('ACC_project_input');

  projectDropdown.addEventListener('change', function () {
    selectedProjectNameOption = projectDropdown.options[projectDropdown.selectedIndex].innerText;
    sessionStorage.setItem('selectedProjectName', selectedProjectNameOption);

    let selectedProjectIDOption = projectDropdown.value;
    sessionStorage.setItem('selectedProjectID', selectedProjectIDOption);

    console.log(selectedProjectNameOption, selectedProjectIDOption)

  });
  // Modal button: Retake Test reloads the page to restart the quiz.
  document.getElementById("retakeBtn").addEventListener("click", function () {
    window.location.reload();
  });
  // Toggle email input based on acknowledgment checkbox.
  document
    .getElementById("acknowledge")
    .addEventListener("change", function () {
      var emailDiv = document.getElementById("emailDiv");
      if (this.checked) {
        emailDiv.classList.remove("hidden");
      } else {
        emailDiv.classList.add("hidden");
        document.getElementById("submitBtn").disabled = true;
      }
    });

  // Enable submit button only if a valid email is entered.
  document.getElementById("email").addEventListener("input", function () {
    var email = this.value;
    var submitBtn = document.getElementById("submitBtn");
    // Basic email validation pattern.
    var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    submitBtn.disabled = !emailPattern.test(email);
  });

  // Handle form submission.
  document.getElementById("submitBtn").addEventListener("click", async function (e) {
    e.preventDefault();
    const test = e.target.value;
    console.log(test);
    // const result = await scoreChecker(test);
    const result = true
    if(result){
      // Gather the form data.
      userName = document.getElementById("name").value;
      userEmail = document.getElementById("email").value;
      sessionStorage.setItem('userName',userName);
      sessionStorage.setItem('userEmail',userEmail);
      // Log the values or use them as needed.
      console.log("Name:", userName);
      console.log("Email:", userEmail);
      var data = {
        name: userName,
        email: userEmail,
        testLevel: "L1",
        l1Q1: document.querySelector(`input[name="question1"]:checked`).value,
        l1Q2: document.querySelector(`input[name="question2"]:checked`).value,
        l1Q3: document.querySelector(`input[name="question3"]:checked`).value,
        l1Q4: document.querySelector(`input[name="question4"]:checked`).value,
        l1Q5: document.querySelector(`input[name="question5"]:checked`).value,
        project:selectedProjectNameOption
      };
      console.log(data)
    // Send the data via a POST request (adjust the endpoint URL as needed).
    await fetch(
      "https://prod-32.uksouth.logic.azure.com:443/workflows/8188a034ed174f588e630c35f3bf3c2a/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=P42z_UOd8aiFgboI6ycXrN6kbBY7YDI1Dwx3Gfu1Cv0",
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
          console.log('Submission Successful')
          window.location.href = 'feedback.html';
        }
        return response.json();
      })
      .then(function (responseData) {
        
      })
      .catch(function (error) {
        console.error("Error:", error);
      });

    }
    return;



  });

  await getProjects()

});

async function scoreChecker(test) {
  let answers;
  switch (test) {
    case "level1":
      answers = answers_level1;
      testLevel = `L1-V${level1Version}`
      break;
    case "level2":
      answers = answers_level2;
      testLevel = `L2-V${level2Version}`
      break;
    default:
      break;
  }
  score = 0;
  totalQuestions = Object.keys(answers).length;

  // Loop through each question and compare the user's answer with the answer key.
  for (const question in answers) {
    const selectedAnswer = document.querySelector(
      `input[name="${question}"]:checked`
    );
    if (selectedAnswer && selectedAnswer.value === answers[question]) {
      score++;
    }
  }
  // Calculate percentage score.
  const percentage = (score / totalQuestions) * 100;
  document.getElementById(
    "result"
  ).textContent = `Your score is ${score} out of ${totalQuestions} (${percentage}%).`;

  // If the score is below 80%, display the modal.
  if (percentage < 80) {
    document.getElementById("scoreModal").classList.remove("hidden");
    document.getElementById(
      "retakeMessage"
    ).innerHTML = `<h3>Your score is ${score} out of ${totalQuestions} (${percentage}%)</h3><p>Unfortunately your score is below the minimum percentage of 80%, meaning you haven't passed. Please retake the test to pass this Knowledge Check</p>`;
    return false
  } else {return true}
}

function validateEmail() {
  const email = document.getElementById("email").value;
  const submitButton = document.getElementById("submitBtn");
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

async function getProjects() {

  ProjectListRaw = await fetchProjects()
  console.log("Raw Project List",ProjectListRaw)
  for(let i = 0; i < ProjectListRaw.length; i++){
    ProjectList.push({'ProjectName':ProjectListRaw[i].ProjectName,'ProjectID':ProjectListRaw[i].Title})
}

  const projectDropdown = document.getElementById('ACC_project_input');
  projectDropdown.innerHTML = '<option value="" disabled selected>Please select an project</option>'
  ProjectList.forEach(project => {
    const option = document.createElement('option');
    option.text = project.ProjectName;
    option.value = project.ProjectID;
    projectDropdown.add(option);
  });
  
}

async function fetchProjects() {
  const bodyData = {
      'userID': '',
      'requestType': 'trainingPortal'
      };

  const headers = {
      'Content-Type':'application/json'
  };

  const requestOptions = {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(bodyData)
  };

  const apiUrl = "https://prod-09.uksouth.logic.azure.com:443/workflows/30f57be09dd04690be4212eb4ed6df65/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=LTEr0Q1hYKDoLnA5uWkU59tQcrDJn7scIZIiPHTQa2s";
  //console.log(apiUrl)
  //console.log(requestOptions)
  responseData = await fetch(apiUrl,requestOptions)
      .then(response => response.json())
      .then(data => {
          const JSONdata = data

      console.log(JSONdata)
      
      return JSONdata
      })
      .catch(error => console.error('Error fetching data:', error));


  return responseData
}