fetch('Navbar.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('navbar').innerHTML = data;
    })
    .catch(err => console.error('فشل تحميل Navbar:', err));

//navbar functions 
function openSideBar() {
    document.querySelector('.sideBar').style.display = "flex";
}
function closeSideBar() {
    document.querySelector('.sideBar').style.display = "none";
}




const wishlist = [
  {id: 1, name: "Gucci Duffle Bag", price: 950, oldPrice: 1160, img: "https://via.placeholder.com/200" },
  {id: 2, name: "RGB Liquid CPU Cooler", price: 1950, oldPrice: null, img: "https://via.placeholder.com/200"},
  {id: 3, name: "GP11 Shooter USB Gamepad", price: 550, oldPrice: null, img: "https://via.placeholder.com/200"},
  {id: 4, name: "Quilted Satin Jacket", price: 750, oldPrice: null, img: "https://via.placeholder.com/200"},
  {id: 5, name: "Quilted Satin Jacket", price: 750, oldPrice: null, img: "https://via.placeholder.com/200"},
  {id: 6, name: "Quilted Satin Jacket", price: 750, oldPrice: null, img: "https://via.placeholder.com/200"},
  
  
  
];

const wishlistContainer = document.getElementById("wishlistItems");

// عرض المنتجات
function renderWishlist() {
  wishlistContainer.innerHTML = "";
  wishlist.forEach(item => {
    wishlistContainer.innerHTML += `
      <div class="card">
        <img src="${item.img}" alt="${item.name}">
        <h3>${item.name}</h3>
        <p>
          <span class="price">$${item.price}</span>
          ${item.oldPrice ? `<span class="old-price">$${item.oldPrice}</span>` : ""}
        </p>
        <button>Add To Cart</button>
      </div>
    `;
  });
}

document.getElementById("moveToCart").addEventListener("click", () => {
  alert("All items moved to cart!");
  wishlist.length = 0;
  renderWishlist();
});

renderWishlist();