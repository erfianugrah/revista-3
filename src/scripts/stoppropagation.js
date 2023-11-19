


document.addEventListener('astro:page-load', () => {
    document.querySelector('a').addEventListener('click', function (event) {
        event.stopPropagation();
    });
});