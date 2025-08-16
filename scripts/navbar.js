// // تحميل الnavbar
// fetch('Navbar.html')
//     .then(response => response.text())
//     .then(data => {
//         document.getElementById('navbar').innerHTML = data;
//     })
//     .catch(err => console.error('فشل تحميل Navbar:', err));

//navbar functions 
function openSideBar() {
    document.querySelector('.sideBar').style.display = "flex";
}
function closeSideBar() {
    document.querySelector('.sideBar').style.display = "none";
}
