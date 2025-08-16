
function getCart() {
  return JSON.parse(localStorage.getItem("cart")) || [];
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function addToCart(product) {
  let cart = getCart();
  let existing = cart.find(item => item.id === product.id);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  saveCart(cart);
  alert(product.name + " added to cart!");
}


function getWishlist() {
  return JSON.parse(localStorage.getItem("wishlist")) || [];
}

function saveWishlist(wishlist) {
  localStorage.setItem("wishlist", JSON.stringify(wishlist));
}

function addToWishlist(product) {
  let wishlist = getWishlist();
  let exists = wishlist.find(item => item.id === product.id);

  if (!exists) {
    wishlist.push(product);
    saveWishlist(wishlist);
    alert(product.name + " added to wishlist!");
  } else {
    alert(product.name + " is already in wishlist!");
  }
}


document.addEventListener("DOMContentLoaded", () => {

  document.querySelectorAll(".add-to-cart").forEach(button => {
    button.addEventListener("click", () => {
      let product = {
        id: button.dataset.id,
        name: button.dataset.name,
        price: button.dataset.price,
        image: button.dataset.image
      };
      addToCart(product);
    });
  });

  document.querySelectorAll(".add-to-wishlist").forEach(button => {
    button.addEventListener("click", () => {
      let product = {
        id: button.dataset.id,
        name: button.dataset.name,
        price: button.dataset.price,
        image: button.dataset.image
      };
      addToWishlist(product);
    });
  });

 
  const cartIcon = document.querySelector(".cart-icon");
  const wishlistIcon = document.querySelector(".wishlist-icon");

  if (cartIcon) cartIcon.addEventListener("click", () => window.location.href = "cart.html");
  if (wishlistIcon) wishlistIcon.addEventListener("click", () => window.location.href = "wishlist.html");
});
