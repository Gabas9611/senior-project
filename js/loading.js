const colors = [
    ['#8e24aa', '#43a047'],
    ['#f44336', '#2196f3'],
    ['#ff9800', '#3f51b5'],
    ['#009688', '#e91e63']
];

let index = 0;

setInterval(() => {
    index = (index + 1) % colors.length;
    document.getElementById('leftHalf').setAttribute('fill', colors[index][0]);
    document.getElementById('rightHalf').setAttribute('fill', colors[index][1]);
}, 2000);

let progress = 0;
const progressBar = document.getElementById('progressBar');
const progressPercentage = document.getElementById('progressPercentage');

const interval = setInterval(() => {
    progress += 2; // Increment by 2% every 100ms, reaching 100% in 5 seconds
    if (progress <= 100) {
        progressBar.style.width = progress + '%';
        progressPercentage.textContent = progress + '%';
    }

    if (progress >= 100) {
        progressBar.style.width = '100%';
        progressPercentage.textContent = '100%';
        clearInterval(interval);
        window.location.href = 'index.html';
    }
}, 100); // Update every 100ms