document.addEventListener('astro:page-load', () => {
window.onload = function() {
 console.log('Window loaded');
 let imgElement = document.querySelector('#image img');
 console.log('Image element:', imgElement);
 if (imgElement.getAttribute('src') === '') {
   imgElement.parentElement.remove();
 }
}

});