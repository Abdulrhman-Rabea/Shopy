// document.querySelectorAll('.quantity input').forEach(input => {
//     input.addEventListener('input', function() {
//         const box = this.closest('.box');

//         const price = parseFloat(box.querySelector('.price').textContent.replace('$', ''));

//         const quantity = parseInt(this.value) || 1;

//         box.querySelector('.subtotal').textContent = `$${price * quantity}`;
//     });
// });


document.addEventListener("DOMContentLoaded", () => {
    const quantityInputs = document.querySelectorAll(".quantity input");
    const subtotalDisplay = document.querySelector("#checkout #subtotal");
    const totalDisplay = document.querySelector("#checkout #total");
    const shippingDisplay = document.querySelector("#shipping");
    const couponInput = document.querySelector("#coupon_input");
    const applyCouponBtn = document.querySelector("#apply_coupon_btn");

    let shippingCost = 50; // خليها 50 لو عايزة شحن مدفوع
    let discount = 0;

    function updateProductSubtotal(input) {
        const box = input.closest(".box");
        const price = parseFloat(box.querySelector(".price").textContent.replace("$", ""));
        const quantity = parseInt(input.value);
        const productSubtotal = price * quantity;
        box.querySelector(".subtotal").textContent = `$${productSubtotal}`;
    }

    function updateCartTotals() {
        let subtotal = 0;
        document.querySelectorAll(".box .subtotal").forEach(sub => {
            subtotal += parseFloat(sub.textContent.replace("$", ""));
        });
        subtotalDisplay.textContent = `$${subtotal}`;

        // Shipping
        shippingDisplay.textContent = shippingCost === 0 ? "Free" : `$${shippingCost}`;

        // Total بعد الخصم
        const total = subtotal + shippingCost - discount;
        totalDisplay.textContent = `$${total}`;
    }

    quantityInputs.forEach(input => {
        input.addEventListener("input", () => {
            updateProductSubtotal(input);
            updateCartTotals();
        });
    });

    applyCouponBtn.addEventListener("click", () => {
        const code = couponInput.value.trim();
        if (code === "DISCOUNT10") {
            discount = 10; // خصم 10$
        } else {
            discount = 0;
        }
        updateCartTotals();
    });

    // أول تحديث
    quantityInputs.forEach(input => updateProductSubtotal(input));
    updateCartTotals();
});


// نجيب كل الأزرار اللي فيها الكلاس remove-circle
const removeButtons = document.querySelectorAll('.remove-item');

removeButtons.forEach(button => {
    button.addEventListener('click', () => {
        // نجيب العنصر الأب الأقرب اللي عنده الكلاس box ونشيله
        const box = button.closest('.box');
        if (box) {
            box.remove();

            // تحقق لو مفيش أي بوكسات متبقية
            const remainingBoxes = document.querySelectorAll('.products_container .box');
            if (remainingBoxes.length === 1) { // غالباً أول بوكس هو العنوان
                document.querySelector('#cart_total').style.display = 'none';
                document.querySelector('#coupon_input').style.display = 'none';
                document.querySelector('#apply_coupon_btn').style.display = 'none';

                const emptyImg = document.createElement('img');
                emptyImg.src = "../assets/images/emptyCart.png"
                document.querySelector('.products_container').appendChild(emptyImg);

                const emptyMsg = document.createElement('div');
                emptyMsg.textContent = "Your cart is Empty!";
                emptyMsg.style.textAlign = "center";

                emptyMsg.style.fontSize = "18px";
                emptyMsg.style.fontWeight = "500";
                emptyMsg.style.marginTop = "20px";
                document.querySelector('.products_container').appendChild(emptyMsg);




            }
        }
        // لو عايزة تحدثي الكارت توتال بعد الحذف ممكن تضيفي دالة تحديث هنا

    });
});


document.getElementById('return_to_shop_btn').addEventListener('click', () => {
    window.location.href = "../pages/home.html";
});
