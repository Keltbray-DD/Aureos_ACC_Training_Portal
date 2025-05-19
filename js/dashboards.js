document.addEventListener("DOMContentLoaded", async function () {
    let surveyData
    surveyData = await getTrainingRecordData()
    console.log(surveyData)
    await generateCharts(surveyData.L1,'Level1')
    await generateCharts(surveyData.L2,'Level2')
    await generateOverviewTab(surveyData.All)

});

// Function to switch tabs
function openTab(evt, tabName) {
    var i, tabcontent, tablinks;
    
    // Hide all tab contents
    tabcontent = document.getElementsByClassName("tab-content");
    for (i = 0; i < tabcontent.length; i++) {
      tabcontent[i].style.display = "none";
      tabcontent[i].classList.remove("active");
    }
    
    // Remove the active class from all tabs
    tablinks = document.getElementsByClassName("tab-link");
    for (i = 0; i < tablinks.length; i++) {
      tablinks[i].classList.remove("active");
    }
    
    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(tabName).style.display = "block";
    document.getElementById(tabName).classList.add("active");
    evt.currentTarget.classList.add("active");
  }

async function getTrainingRecordData() {
    const headers = {
        "Content-Type": "application/json",
    };

    const requestOptions = {
        method: 'GET',
        headers: headers,
    };

    const apiUrl = "https://prod-16.uksouth.logic.azure.com:443/workflows/09133fc849284dd2ba35cbde78a2f22e/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=yDoMfRRSiraqC8UjQfFUsir7drSC7qsoAl5j1l9UZ30";
    //console.log(apiUrl)
    //console.log(requestOptions)
    responseData = await fetch(apiUrl, requestOptions)
        .then(response => response.json())
        .then(data => {
            const JSONdata = data
            return JSONdata
        })
        .catch(error => console.error('Error fetching data:', error));
    return responseData
}

async function generateSummaryBoxes(data) {
        // Create an object to store the counts for each training level.
    // If you have additional levels, add them here.
    const trainingCounts = {
        L1: 0,
        L2: 0,
        L3: 0
      };
  
      // Loop through userData and count occurrences of each training level.
      data.forEach(user => {
        const level = user.Training;
        if (trainingCounts[level] !== undefined) {
          trainingCounts[level]++;
        }
      });
  
    // Insert counts into each element
    document.getElementById("l1FullCount").textContent = `L1: ${trainingCounts.L1} users`;
    document.getElementById("l2FullCount").textContent = `L2: ${trainingCounts.L2} users`;
    document.getElementById("l3FullCount").textContent = `L3: ${trainingCounts.L3} users`;

      // Get the current month and year.
    const now = new Date();
    const currentMonth = now.getMonth(); // Months are 0-indexed (0=January)
    const currentYear = now.getFullYear();

    // Create an object to store the counts for each training level.
    const trainingCountsCurrentMonth = {
      L1: 0,
      L2: 0,
      L3: 0
    };

    // Loop through each record and count those with a "Training Completed On" date in the current month.
    data.forEach(user => {
      // Parse the date (assumes the date is in "YYYY-MM-DD" format)
      const trainingDate = new Date(user["Training Completed On"]);
      if (trainingDate.getMonth() === currentMonth && trainingDate.getFullYear() === currentYear) {
        const level = user.Training;
        if (trainingCountsCurrentMonth[level] !== undefined) {
          trainingCountsCurrentMonth[level]++;
        }
      }
    });

    // Insert counts into each element
    document.getElementById("l1Count").textContent = `L1: ${trainingCountsCurrentMonth.L1} users`;
    document.getElementById("l2Count").textContent = `L2: ${trainingCountsCurrentMonth.L2} users`;
    document.getElementById("l3Count").textContent = `L3: ${trainingCountsCurrentMonth.L3} users`;
}

async function generateOverviewTab(data) {
    
    await generateSummaryBoxes(data)
        // Group users by project count
        const projectCounts = {};
        data.forEach(user => {
          const project = user.Project;
          if (!projectCounts[project]) {
            projectCounts[project] = 0;
          }
          projectCounts[project]++;
        });
    
        // Prepare labels and data for the pie chart
        const projectLabels = Object.keys(projectCounts);
        const projectData = Object.values(projectCounts);
    
        // Create the pie chart using Chart.js
        const ctx = document.getElementById('projectPieChart').getContext('2d');
        const myPieChart = new Chart(ctx, {
          type: 'pie',
          data: {
            labels: projectLabels,
            datasets: [{
              data: projectData,
              backgroundColor: [
                'rgba(255, 99, 132, 0.6)',
                'rgba(54, 162, 235, 0.6)',
                'rgba(255, 206, 86, 0.6)',
                'rgba(75, 192, 192, 0.6)',
                'rgba(153, 102, 255, 0.6)'
              ],
              borderColor: [
                'rgb(255, 255, 255)',

              ],
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                position: 'right'
              }
            },
            onClick: (evt, activeElements) => {
              if (activeElements.length > 0) {
                const index = activeElements[0].index;
                const projectClicked = projectLabels[index];
                displayUsersForProject(projectClicked,'project');
              }
            }
          }
        });

        // Group users by project count
        const buCounts = {};
        data.forEach(user => {
          const bu = user.bu;
          if (!buCounts[bu]) {
            buCounts[bu] = 0;
          }
          buCounts[bu]++;
        });
    
        // Prepare labels and data for the pie chart
        const buLabels = Object.keys(buCounts);
        const buData = Object.values(buCounts);
    
        // Create the pie chart using Chart.js
        const ctxBU = document.getElementById('buPieChart').getContext('2d');
        const buPieChart = new Chart(ctxBU, {
          type: 'pie',
          data: {
            labels: buLabels,
            datasets: [{
              data: buData,
              backgroundColor: [
                'rgba(255, 99, 132, 0.6)',
                'rgba(54, 162, 235, 0.6)',
                'rgba(255, 206, 86, 0.6)',
                'rgba(75, 192, 192, 0.6)',
                'rgba(153, 102, 255, 0.6)'
              ],
              borderColor: [
                'rgb(255, 255, 255)',

              ],
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                position: 'right'
              }
            },
            onClick: (evt, activeElements) => {
              if (activeElements.length > 0) {
                const index = activeElements[0].index;
                const buClicked = buLabels[index];
                displayUsersForProject(buClicked,'bu');
              }
            }
          }
        });
    
        // Function to display a table of users for a specific project
        function displayUsersForProject(project,type) {
          let filteredUsers
          if(type == 'project'){
            filteredUsers = data.filter(user => user.Project === project);
          }
          else{
            filteredUsers = data.filter(user => user.bu === project);
          }
          
          let tableHTML = `<h2>Users for ${type}: ${project}</h2>`;
          tableHTML += `<table>
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th>Level</th>
                              <th>Completed</th>
                            </tr>
                          </thead>
                          <tbody>`;
          filteredUsers.forEach(user => {
            tableHTML += `<tr>
                            <td>${user.Name}</td>
                            <td>${user.Training}</td>
                            <td>${user['Training Completed On']}</td>
                          </tr>`;
          });
          tableHTML += `</tbody></table>`;
          document.getElementById('tableContainer').innerHTML = tableHTML;
        }
}

async function generateCharts(data,level) {
    // Define the four yes/no questions (keys as they appear in the data)
    let yesNoQuestions
  switch (level) {
    case 'Level1':
      yesNoQuestions = yesNoQuestionsLevel1
      break;
    case 'Level2':
      yesNoQuestions = yesNoQuestionsLevel2
      break;
  
    default:
      break;
  }

    // Prepare an object to count responses for each yes/no question
    const yesNoCounts = {};
    yesNoQuestions.forEach(q => {
        yesNoCounts[q] = { Y: 0, N: 0 };
    });
    console.log(data)
    // Count responses for each yes/no question
    data.forEach(entry => {
        yesNoQuestions.forEach(q => {
            const answer = entry[q];
            if (answer === "Y") {
                yesNoCounts[q].Y++;
            } else if (answer === "N") {
                yesNoCounts[q].N++;
            }
        });
    });

    // Prepare data for the Yes/No grouped bar chart
    const questions = yesNoQuestions;
    const yesData = questions.map(q => yesNoCounts[q].Y);
    const noData = questions.map(q => yesNoCounts[q].N);

    // Create the Yes/No Chart
    const ctxYesNo = document.getElementById(`yesNoChart${level}`).getContext('2d');
    const yesNoChart = new Chart(ctxYesNo, {
        type: 'bar',
        data: {
            labels: questions,
            datasets: [
                {
                    label: 'Yes',
                    data: yesData,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                },
                {
                    label: 'No',
                    data: noData,
                    backgroundColor: 'rgba(255, 99, 132, 0.6)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            indexAxis: 'y',
            scales: {
                x: { beginAtZero: true }
            }
        }
    });

    // Now, prepare the frequency distribution for the rating question.
    const ratingKey = "On a scale of 1-5, how confident do you feel using ACC for the tasks we went through today?";
    // Initialize counts for ratings 1 through 5
    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    data.forEach(entry => {
        const rating = entry[ratingKey];
        if (ratingCounts[rating] !== undefined) {
            ratingCounts[rating]++;
        }
    });

    const ratingLabels = Object.keys(ratingCounts);
    const ratingData = ratingLabels.map(label => ratingCounts[label]);

    // Create the Rating Distribution Chart
    const ctxRating = document.getElementById(`ratingChart${level}`).getContext('2d');
    const ratingChart = new Chart(ctxRating, {
        type: 'bar',
        data: {
            labels: ratingLabels,
            datasets: [{
                label: 'Count of Responses',
                data: ratingData,
                backgroundColor: 'rgba(153, 102, 255, 0.6)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 } }
            }
        }
    });
}