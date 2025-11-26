document.addEventListener("DOMContentLoaded", async function () {
    
})



 function showPanel(sectionId) {
    const panels = document.querySelectorAll('.panel-content');
    panels.forEach(panel => panel.classList.remove('active'));

    const options = document.querySelectorAll('.sectionOption');
    options.forEach(option => option.classList.remove('active'));

    document.getElementById(`${sectionId}_li`).classList.add('active');
    const activePanel = document.getElementById(sectionId);
    if (activePanel) {
        activePanel.classList.add('active');    
    }
 }

 function showPanelSection(sectionId) {
    const sections = document.querySelectorAll('.section-content');
    sections.forEach(section => section.classList.remove('active'));

    const options = document.querySelectorAll('.mediaOption');
    options.forEach(option => option.classList.remove('active'));

    document.getElementById(`${sectionId}_btn`).classList.add('active');
    const activeSection = document.getElementById(sectionId);
    if (activeSection) {
        activeSection.classList.add('active');    
    }
 }
