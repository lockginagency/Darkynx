        const YOOMONEY_WALLET = '4100117768437490';
        const WEB3FORMS_KEY = '613c201d-64a1-4421-bccc-ebe70d066dc4';

        let cart = JSON.parse(localStorage.getItem('darkynx_cart') || '[]');
        let currentModalId = null;
        let currentSize = null;

        function saveCart(){ localStorage.setItem('darkynx_cart', JSON.stringify(cart)); }

        const container = document.getElementById('catalog-container');
        products.forEach(p => {
            const card = document.createElement('div');
            card.className = 'product-card';
            const wrapper = document.createElement('div');
            wrapper.className = 'img-wrapper';
            const img = document.createElement('img');
            img.src = p.img;
            img.alt = p.name;
            img.loading = 'lazy';
            wrapper.appendChild(img);

            card.appendChild(wrapper);

            card.innerHTML += `
                <div class="product-title">${p.name}</div>
                <div class="product-desc">${p.desc}</div>
                <div class="product-price">${p.price} ₽</div>
                <button class="add-to-cart-btn" onclick="event.stopPropagation(); quickAdd(${p.id})">Купить</button>
            `;

            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const rotateX = ((y - rect.height / 2) / rect.height) * -12;
                const rotateY = ((x - rect.width / 2) / rect.width) * 12;
                wrapper.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            });
            card.addEventListener('mouseleave', () => {
                wrapper.style.transform = 'rotateX(0deg) rotateY(0deg)';
            });
            card.onclick = () => openModal(p.id);
            container.appendChild(card);
        });

        function openModal(id) {
            currentModalId = id;
            const p = products.find(x => x.id === id);
            document.getElementById('modal-img').src = p.img;
            document.getElementById('modal-title').innerText = p.name;
            document.getElementById('modal-desc').innerText = p.desc;
            document.getElementById('modal-price').innerText = p.price + ' ₽';
            document.getElementById('productModal').style.display = 'flex';
            currentSize = null;
            document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
        }
        function closeModal() { document.getElementById('productModal').style.display = 'none'; }
        function selectSize(btn) {
            document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentSize = btn.innerText;
        }
        function showNotification(text) {
            document.getElementById('notif-text').innerText = text;
            document.getElementById('notification').style.display = 'flex';
        }
        function closeNotification() { document.getElementById('notification').style.display = 'none'; }

        function addFromModal() {
            if(!currentSize) { showNotification("Выберите размер!"); return; }
            const p = products.find(x => x.id === currentModalId);
            addToCart(p, currentSize);
            closeModal();
            showNotification(`"${p.name}" (${currentSize}) добавлен в корзину`);
        }

        function quickAdd(id) { openModal(id); }

        function addToCart(product, size) {
            const existing = cart.find(i => i.id === product.id && i.size === size);
            if (existing) existing.qty += 1;
            else cart.push({ id: product.id, name: product.name, price: product.price, img: product.img, size, qty: 1 });
            saveCart();
            updateCartUI();
        }

        function changeQty(index, delta) {
            cart[index].qty += delta;
            if (cart[index].qty <= 0) cart.splice(index, 1);
            saveCart();
            updateCartUI();
        }

        function removeFromCart(index) {
            cart.splice(index, 1);
            saveCart();
            updateCartUI();
        }

        function updateCartUI() {
            const count = cart.reduce((s, i) => s + i.qty, 0);
            document.getElementById('header-cart-count').innerText = count;
            document.getElementById('float-cart-count').innerText = count;

            const container = document.getElementById('cart-items');
            container.innerHTML = '';
            let total = 0;
            cart.forEach((item, index) => {
                total += item.price * item.qty;
                container.innerHTML += `
                    <div class="cart-item">
                        <div>
                            <div class="cart-item-name">${item.name}</div>
                            <div class="cart-item-size">Размер: ${item.size}</div>
                            <div class="qty-controls">
                                <button onclick="changeQty(${index},-1)">−</button>
                                <span>${item.qty}</span>
                                <button onclick="changeQty(${index},1)">+</button>
                            </div>
                        </div>
                        <div style="display:flex;align-items:center;gap:10px;">
                            <div class="cart-item-price">${item.price * item.qty} ₽</div>
                            <button class="remove-item" onclick="removeFromCart(${index})">✕</button>
                        </div>
                    </div>
                `;
            });
            document.getElementById('total-price').innerText = total;
        }
        function toggleCart() { document.getElementById('cartSidebar').classList.toggle('open'); }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeModal();
                closeNotification();
                document.getElementById('cartSidebar').classList.remove('open');
            }
        });

        updateCartUI();

        /* ================== ОФОРМЛЕНИЕ ЗАКАЗА (СДЭК + валидация) ================== */

        // Статические пункты СДЭК для демонстрации
        const CDEK_POINTS = [
            { city: 'Москва', name: 'ПВЗ Тверская', address: 'г. Москва, ул. Тверская, д. 10', code: 'MSK-101', hours: '09:00–21:00' },
            { city: 'Москва', name: 'Постамат Арбат', address: 'г. Москва, ул. Арбат, д. 25', code: 'MSK-202', hours: 'круглосуточно' },
            { city: 'Санкт-Петербург', name: 'ПВЗ Невский', address: 'г. Санкт-Петербург, Невский пр-т, д. 50', code: 'SPB-101', hours: '10:00–20:00' },
            { city: 'Самара', name: 'ПВЗ Московское шоссе', address: 'г. Самара, ул. Московское шоссе, д. 4, ПВЗ № 123', code: 'SAM-123', hours: '09:00–20:00' },
            { city: 'Самара', name: 'Постамат Ленина', address: 'г. Самара, ул. Ленина, д. 15', code: 'SAM-215', hours: 'круглосуточно' },
            { city: 'Новосибирск', name: 'ПВЗ Красный проспект', address: 'г. Новосибирск, Красный проспект, д. 30', code: 'NSK-101', hours: '09:00–21:00' },
            { city: 'Екатеринбург', name: 'ПВЗ Малышева', address: 'г. Екатеринбург, ул. Малышева, д. 12', code: 'EKB-101', hours: '10:00–20:00' }
        ];

        // переключение блоков СДЭК / Почта России
        function toggleDeliveryBlocks() {
            const isCdek = document.querySelector('input[name="cf-delivery"]:checked').value === 'cdek';
            document.getElementById('cf-cdek-block').style.display = isCdek ? 'block' : 'none';
            document.getElementById('cf-post-block').style.display = isCdek ? 'none' : 'block';
        }

        let selectedCdekPoint = null;

        const cfCity = document.getElementById('cf-city');
        const cfFindBtn = document.getElementById('cf-find-btn');

        // кнопка "Найти пункты СДЭК" активна только если город заполнен
        cfCity.addEventListener('input', () => {
            cfFindBtn.disabled = cfCity.value.trim().length === 0;
        });

        // сброс выбранного пункта при смене города
        function cdekResetPoint() {
            selectedCdekPoint = null;
            document.getElementById('cf-point-info').style.display = 'none';
        }

        function openCdekPicker() {
            const city = cfCity.value.trim();
            document.getElementById('cdek-city-label').textContent = city;
            const list = document.getElementById('cdek-list');
            const empty = document.getElementById('cdek-empty');
            const matches = CDEK_POINTS.filter(p => p.city.toLowerCase() === city.toLowerCase());

            list.innerHTML = '';
            if (matches.length === 0) {
                empty.style.display = 'block';
            } else {
                empty.style.display = 'none';
                matches.forEach((p, i) => {
                    const card = document.createElement('div');
                    card.className = 'cdek-point-card';
                    card.innerHTML = `<b>${p.name}</b><br>${p.address}<br><span class="cdek-point-code">Режим работы: ${p.hours} · Код: ${p.code}</span>`;
                    card.onclick = () => selectCdekPoint(matches[i]);
                    list.appendChild(card);
                });
            }
            document.getElementById('cdekOverlay').style.display = 'flex';
        }
        function closeCdekPicker() { document.getElementById('cdekOverlay').style.display = 'none'; }

        function selectCdekPoint(point) {
            selectedCdekPoint = point;
            document.getElementById('cf-point-address').textContent = point.address;
            document.getElementById('cf-point-code').textContent = point.code;
            document.getElementById('cf-point-info').style.display = 'block';
            closeCdekPicker();
        }

        // маска телефона +7 (___) ___-__-__
        const cfPhone = document.getElementById('cf-phone');
        cfPhone.addEventListener('input', () => {
            let digits = cfPhone.value.replace(/\D/g, '').replace(/^7/, '').replace(/^8/, '').slice(0, 10);
            let masked = '+7';
            if (digits.length > 0) masked += ' (' + digits.slice(0, 3);
            if (digits.length >= 3) masked += ') ' + digits.slice(3, 6);
            if (digits.length >= 6) masked += '-' + digits.slice(6, 8);
            if (digits.length >= 8) masked += '-' + digits.slice(8, 10);
            cfPhone.value = masked;
        });

        // открыть форму по кнопке "Оплатить заказ" (только если корзина не пуста)
        document.getElementById('openCheckoutBtn').addEventListener('click', () => {
            if (cart.length === 0) { showNotification('Корзина пуста'); return; }
            document.getElementById('cf-error').style.display = 'none';
            document.getElementById('cf-success').style.display = 'none';
            document.getElementById('checkoutForm').style.display = 'block';
            document.getElementById('checkoutOverlay').style.display = 'flex';
        });
        function closeCheckout() { document.getElementById('checkoutOverlay').style.display = 'none'; }

        // проверка, что реально ни одно обязательное поле не пустое
        document.getElementById('checkoutForm').addEventListener('submit', (e) => {
            e.preventDefault();

            const fio = document.getElementById('cf-fio').value.trim();
            const phoneDigits = cfPhone.value.replace(/\D/g, '');
            const agree1 = document.getElementById('cf-agree1').checked;
            const agree2 = document.getElementById('cf-agree2').checked;
            const deliveryMethod = document.querySelector('input[name="cf-delivery"]:checked').value;

            const baseFields = [
                { el: document.getElementById('cf-fio'), ok: fio.split(/\s+/).filter(Boolean).length >= 2 },
                { el: cfPhone, ok: phoneDigits.length >= 11 }
            ];

            let deliveryOk = false;
            let deliveryInfo = {};

            if (deliveryMethod === 'cdek') {
                const indexVal = document.getElementById('cf-index').value.trim();
                const city = cfCity.value.trim();
                baseFields.push(
                    { el: document.getElementById('cf-index'), ok: /^\d{6}$/.test(indexVal) },
                    { el: cfCity, ok: city.length > 0 }
                );
                deliveryOk = baseFields.slice(2).every(f => f.ok) && !!selectedCdekPoint;
                deliveryInfo = { method: 'СДЭК', index: indexVal, city, point: selectedCdekPoint };
            } else {
                const postIndex = document.getElementById('cf-post-index').value.trim();
                const postCity = document.getElementById('cf-post-city').value.trim();
                const postAddress = document.getElementById('cf-post-address').value.trim();
                baseFields.push(
                    { el: document.getElementById('cf-post-index'), ok: /^\d{6}$/.test(postIndex) },
                    { el: document.getElementById('cf-post-city'), ok: postCity.length > 0 },
                    { el: document.getElementById('cf-post-address'), ok: postAddress.length > 0 }
                );
                deliveryOk = baseFields.slice(2).every(f => f.ok);
                deliveryInfo = { method: 'Почта России', index: postIndex, city: postCity, address: postAddress };
            }

            let allOk = baseFields.slice(0, 2).every(f => f.ok) && deliveryOk && agree1 && agree2;

            // подсветка невалидных полей
            baseFields.forEach(f => f.el.classList.toggle('cf-invalid', !f.ok));

            const errEl = document.getElementById('cf-error');
            if (!allOk) {
                errEl.style.display = 'block';
                return;
            }
            errEl.style.display = 'none';

            // сумма заказа
            const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
            const orderText = cart.map(i => `${i.name} (${i.size}) x${i.qty}`).join(', ');
            const payType = document.querySelector('input[name="cf-pay"]:checked').value;
            const email = document.getElementById('cf-email').value.trim();
            const comment = document.getElementById('cf-comment').value.trim();

            // текст доставки для письма
            let deliveryText = '';
            if (deliveryInfo.method === 'СДЭК') {
                deliveryText = `СДЭК, ${deliveryInfo.city}, ${deliveryInfo.point.address} (код ${deliveryInfo.point.code})`;
            } else {
                deliveryText = `Почта России, ${deliveryInfo.city}, индекс ${deliveryInfo.index}, ${deliveryInfo.address}`;
            }

            const itemsText = cart.map(i => `${i.name} (${i.size}) x${i.qty}`).join('\n');

            const messageBody =
        `Получатель: ${fio}
        Телефон: ${cfPhone.value}
        Email: ${email || '—'}

        Товары:
        ${itemsText}

        Итого: ${total} ₽
        Оплата: ${payType === 'online' ? 'онлайн' : 'наложенный платёж'}
        Доставка: ${deliveryText}
        Комментарий: ${comment || '—'}`;

            // отправка письма о заказе через Web3Forms
            fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    access_key: WEB3FORMS_KEY,
                    subject: `Новый заказ DARKYNX — ${total} ₽`,
                    from_name: 'DARKYNX Shop',
                    email: email || 'no-reply@darkynx.shop',
                    message: messageBody
                })
            })
            .then(r => r.json())
            .then(data => {
                if (!data.success) console.error('Web3Forms error:', data);
            })
            .catch(err => console.error('Ошибка отправки заказа:', err));

            console.log('Заказ оформлен:', {
                fio, phone: cfPhone.value, email,
                delivery: deliveryInfo,
                payType, comment,
                items: cart, total
            });

            document.getElementById('checkoutForm').style.display = 'none';
            document.getElementById('cf-success').style.display = 'block';

            const link = document.getElementById('checkout-link');
            if (payType === 'online') {
                link.href = `https://yoomoney.ru/quickpay/confirm.xml?receiver=${YOOMONEY_WALLET}&quickpay-form=shop&targets=${encodeURIComponent('Заказ DARKYNX: ' + orderText)}&sum=${total}&label=darkynx_order`;
                link.textContent = 'Перейти к оплате на ЮMoney';
                link.style.display = 'block';
            } else {
                link.style.display = 'none';
                document.getElementById('cf-success').insertAdjacentHTML('beforeend',
                    '<p style="margin-top:10px;">Оплата наложенным платежом — оплатите заказ курьеру/в пункте СДЭК при получении.</p>');
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') { closeCheckout(); closeCdekPicker(); }
        });
