document.addEventListener('astro:page-load', () => {
    window.onload = function () {
        let imgElement = document.querySelector('#image img');
        if (imgElement.getAttribute('src') === '') {
            imgElement.parentElement.style.display = 'none';
        }
    }
});