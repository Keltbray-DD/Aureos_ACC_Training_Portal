const appName = "ACC Training Portal";
const appVersion = "v1.3.0";
const level1Version = 1
const level2Version = 1

let testLevel
let score
let totalQuestions
let selectedProjectNameOption
let selectedBuOption
let ProjectList =[]
let roleData
let trainingList

let userName;
let userEmail;
let selectedRole;

let roleDropdown;
let searchInput;

// Dashboard Variables

const yesNoQuestionsLevel1 = [
  "Know how to upload a document in ACC?",
  "Know how to include the project email address in correspondence?",
  "Understand where to access ACC training materials and guides?",
  "Know who to contact for support when needed?"
];

const yesNoQuestionsLevel2 = [
  "I know how to use the correct workflow to move files from WIP to Shared?",
  "I understand the purpose of metadata and attributes when uploading files?",
  "I feel confident using the Review tool to submit and monitor file reviews?",
  "I know how to create and assign Issues in ACC.",
  "I understand how to use Forms for site records?",
  "I know how to link photos and references to RFIs, Forms, and Issues.",
  "I understand how to create a meeting in ACC Build and how to conduct project meeting within it.",
  "I know who the primary point of contact is for support when needed?"
];
