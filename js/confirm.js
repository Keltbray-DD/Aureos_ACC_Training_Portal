document.addEventListener("DOMContentLoaded", async function () {
    // setTimeout(function() {
    //     window.location.href = 'index.html';
    //   }, 15000); // 10000 milliseconds = 10 seconds
      document.querySelector('.progress').addEventListener('animationend', function() {
        // Navigate to the desired page once the circle is filled
        window.location.href = 'index.html';
      });
})