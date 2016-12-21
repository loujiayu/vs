import './css/index.scss'

const sWrapper = document.getElementsByClassName('search-wrapper')[0]
window.addEventListener('resize', function(e) {
  if (window.innerWidth < 650) {
    sWrapper.style.marginLeft = (window.innerWidth - 450) / 10 + '%'
  }
});

const webviews = document.getElementById('webviews')
const searchBar = document.getElementById('search-input')
const searchValue = document.getElementById('search-value');

sWrapper.addEventListener('click', function() {
  searchValue.className = 'left-align'
  if (!searchBar.value) {
    setTimeout(() => {
      searchBar.value = searchValue.innerHTML
      searchValue.innerHTML = '';
      searchBar.setSelectionRange(0, searchBar.value.length)
    }, 200)
  } else {
    searchBar.setSelectionRange(0, searchBar.value.length)
  }
  searchBar.focus()
})

searchBar.addEventListener('keydown', (e) => {
  if (e.keyCode === 13) {
    const url = 'https://www.bing.com/search?q=' + searchBar.value
    webviewDom(url)
    searchValue.innerHTML = searchBar.value
    searchValue.className = 'center-align'
    searchBar.value = ''
    searchBar.blur()
  }
})

// TODO: add tabs
function webviewDom(url) {
  const webview = document.createElement('webview')
  webview.setAttribute('src', url)

  if (webviews.hasChildNodes()) {
    webviews.firstChild.remove()
  }

  webviews.appendChild(webview);
}
