document.addEventListener('astro:page-load', () => {
    document.addEventListener('DOMContentLoaded', function () {
        let imgElement = document.querySelector('#image img');
        if (imgElement.getAttribute('src') === "") {
            imgElement.parentElement.remove();
        }
    });
});