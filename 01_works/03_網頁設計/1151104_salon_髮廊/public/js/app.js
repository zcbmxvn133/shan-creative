

        /* =========================================
           Google Apps Script Web API 設定

           請把下方網址改成你部署後的 Web App 網址。
           範例：https://script.google.com/macros/s/你的部署ID/exec
        ========================================= */

        const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyo7t5q4y60gGc-egmgGWoV4N_fbhCRNIUWp6VLfAE7zJpkMIwicTFDtcDhwepOAyoL/exec";

        /* =========================================
           抓取元素
        ========================================= */

        const header =
            document.querySelector(
                ".site-header"
            );

        const menuToggle =
            document.querySelector(
                ".menu-toggle"
            );

        const navList =
            document.querySelector(
                ".nav-list"
            );

        const navLinks =
            document.querySelectorAll(
                ".nav-link"
            );

        const faqButtons =
            document.querySelectorAll(
                ".faq-question"
            );

        const backToTop =
            document.querySelector(
                ".back-to-top"
            );

        const backToBottom =
            document.querySelector(
                ".back-to-bottom"
            );

        const memberForm =
            document.querySelector(
                "#member-form"
            );

        const reservationForm =
            document.querySelector(
                "#reservation-form"
            );

        const reservationQueryForm =
            document.querySelector(
                "#reservation-query-form"
            );

        const queryPhone =
            document.querySelector(
                "#query-phone"
            );

        const queryName =
            document.querySelector(
                "#query-name"
            );

        const queryResults =
            document.querySelector(
                "#query-results"
            );

        const queryStatus =
            document.querySelector(
                "#query-status"
            );

        const openQueryDialogButton =
            document.querySelector(
                "#open-query-dialog"
            );

        const openMemberDialogButton =
            document.querySelector(
                "#open-member-dialog"
            );

        const openMemberQueryButton =
            document.querySelector(
                "#open-member-query"
            );

        const openReservationFormButton =
            document.querySelector(
                "#open-reservation-form"
            );

        const memberQueryForm =
            document.querySelector(
                "#member-query-form"
            );

        const memberQueryName =
            document.querySelector(
                "#member-query-name"
            );

        const memberQueryPhone =
            document.querySelector(
                "#member-query-phone"
            );

        const memberQueryResult =
            document.querySelector(
                "#member-query-result"
            );

        const memberCenterCards =
            document.querySelectorAll(".member-center-card");

        const memberCenterPanels =
            document.querySelectorAll(".member-center-panel");

        const memberCenterTabs =
            document.querySelectorAll(".member-center-tab");

        const memberCenterDialog =
            document.querySelector("#member-center-dialog");

        const closeMemberCenterDialogButton =
            document.querySelector("#close-member-center-dialog");

        const memberToReservationButton =
            document.querySelector("#member-to-reservation");

        const memberQueryActions =
            document.querySelector("#member-query-actions");

        const queryMemberToReservationButton =
            document.querySelector("#query-member-to-reservation");

        const queryMemberToRegisterButton =
            document.querySelector("#query-member-to-register");

        const cancelConfirmLayer =
            document.querySelector("#cancel-confirm-layer");

        const cancelConfirmText =
            document.querySelector("#cancel-confirm-text");

        const cancelConfirmBack =
            document.querySelector("#cancel-confirm-back");

        const cancelConfirmSubmit =
            document.querySelector("#cancel-confirm-submit");

        let pendingCancellation = null;

        const memberPanelMap = {
            "open-member-dialog": "member-register-panel",
            "open-member-query": "member-lookup-panel",
            "open-reservation-form": "reservation-order-panel",
            "open-query-dialog": "reservation-lookup-panel"
        };

        function showMemberCenterPanel(buttonId) {
            const targetId = memberPanelMap[buttonId];

            memberCenterCards.forEach(function (card) {
                const active = card.id === buttonId;
                card.classList.toggle("is-active", active);
                card.setAttribute("aria-pressed", String(active));
            });

            memberCenterPanels.forEach(function (panel) {
                const active = panel.id === targetId;
                panel.hidden = !active;
                panel.classList.toggle("is-active", active);
            });

            memberCenterTabs.forEach(function (tab) {
                const active = tab.dataset.memberAction === buttonId;
                tab.classList.toggle("is-active", active);
                tab.setAttribute("aria-selected", String(active));
                tab.tabIndex = active ? 0 : -1;
            });

            if (!memberCenterDialog.open) {
                memberCenterDialog.showModal();
            }

            memberCenterDialog.querySelector(".member-center-workspace")
                .scrollTop = 0;
        }

        closeMemberCenterDialogButton.addEventListener(
            "click",
            function () {
                memberCenterDialog.close();
            }
        );

        memberCenterDialog.addEventListener(
            "click",
            function (event) {
                if (event.target === memberCenterDialog) {
                    memberCenterDialog.close();
                }
            }
        );

        memberCenterDialog.addEventListener("close", function () {
            cancelConfirmLayer.hidden = true;
            pendingCancellation = null;
            memberCenterCards.forEach(function (card) {
                card.classList.remove("is-active");
                card.setAttribute("aria-pressed", "false");
            });
        });

        memberCenterTabs.forEach(function (tab) {
            tab.addEventListener("click", function () {
                const action = tab.dataset.memberAction;
                showMemberCenterPanel(action);

                const targetPanel = document.querySelector(
                    "#" + memberPanelMap[action]
                );
                const firstField = targetPanel.querySelector("input, select, textarea");
                if (firstField) firstField.focus();
            });

            tab.addEventListener("keydown", function (event) {
                if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
                event.preventDefault();
                const tabs = Array.from(memberCenterTabs);
                const step = event.key === "ArrowRight" ? 1 : -1;
                const nextIndex = (tabs.indexOf(tab) + step + tabs.length) % tabs.length;
                tabs[nextIndex].click();
                tabs[nextIndex].focus();
            });
        });

        const reservationDate =
            document.querySelector(
                "#reservation-date"
            );

        function getTaiwanToday() {

            return new Intl.DateTimeFormat(
                "en-CA",
                {
                    timeZone: "Asia/Taipei",
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit"
                }
            ).format(new Date());

        }

        /* =========================================
           會員與預約 API
        ========================================= */

        function showFormStatus(element, message, type) {

            element.textContent = message;
            element.className =
                "form-status is-visible "
                + (type === "success" ? "is-success" : "is-error");

        }

        function isApiUrlReady() {

            return APPS_SCRIPT_URL.startsWith(
                "https://script.google.com/macros/s/"
            );

        }

        async function sendToAppsScript(form, statusElement, action) {

            if (!isApiUrlReady()) {

                showFormStatus(
                    statusElement,
                    "尚未設定 API 網址，請先修改程式中的 APPS_SCRIPT_URL。",
                    "error"
                );

                return;

            }

            const submitButton =
                form.querySelector("button[type='submit']");

            const formData =
                new FormData(form);

            const payload =
                Object.fromEntries(formData.entries());

            payload.action = action;
            payload.createdAt = new Date().toISOString();

            if (action === "registerMember") {

                payload.role = "member";
                payload.consent = formData.has("consent");

            }

            submitButton.disabled = true;
            submitButton.textContent = "資料傳送中…";

            try {

                const response = await fetch(
                    APPS_SCRIPT_URL,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "text/plain;charset=utf-8"
                        },
                        body: JSON.stringify(payload),
                        redirect: "follow"
                    }
                );

                if (!response.ok) {
                    throw new Error("HTTP " + response.status);
                }

                const responseText = await response.text();
                let result = {};

                try {
                    result = responseText ? JSON.parse(responseText) : {};
                } catch (parseError) {
                    throw new Error("伺服器回傳格式錯誤，請稍後再試。");
                }

                if (result.success === false) {
                    throw new Error(result.message || "資料寫入失敗");
                }

                const successMessage =
                    action === "registerMember"
                        ? "會員加入成功！現在可以前往服務預約。"
                        : "預約資料已送出！請等待髮廊確認預約時段。";

                showFormStatus(
                    statusElement,
                    result.message || successMessage,
                    "success"
                );

                if (action === "registerMember") {
                    reservationForm.elements.name.value = payload.name || "";
                    reservationForm.elements.phone.value = payload.phone || "";
                    reservationForm.elements.email.value = payload.email || "";
                    memberToReservationButton.hidden = false;
                }

                form.reset();

                if (action === "createReservation") {
                    reservationDate.min = getTaiwanToday();
                }

            } catch (error) {

                showFormStatus(
                    statusElement,
                    "傳送失敗：" + error.message,
                    "error"
                );

            } finally {

                submitButton.disabled = false;
                submitButton.textContent =
                    action === "registerMember"
                        ? "確認加入會員"
                        : "送出預約";

            }

        }

        memberForm.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();

                const statusElement =
                    document.querySelector("#member-status");

                const phone =
                    memberForm.elements.phone.value.replace(/\D/g, "");

                if (!/^09\d{8}$/.test(phone)) {
                    showFormStatus(
                        statusElement,
                        "請輸入正確的台灣手機號碼，例如：0912345678。",
                        "error"
                    );
                    return;
                }

                memberForm.elements.phone.value = phone;

                sendToAppsScript(
                    memberForm,
                    statusElement,
                    "registerMember"
                );

            }
        );

        reservationForm.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();

                const statusElement =
                    document.querySelector("#reservation-status");

                const phone =
                    reservationForm.elements.phone.value.replace(/\D/g, "");

                if (!/^09\d{8}$/.test(phone)) {
                    showFormStatus(
                        statusElement,
                        "請輸入正確的台灣手機號碼，例如：0912345678。",
                        "error"
                    );
                    return;
                }

                reservationForm.elements.phone.value = phone;

                sendToAppsScript(
                    reservationForm,
                    statusElement,
                    "createReservation"
                );

            }
        );

        reservationDate.min = getTaiwanToday();

        /* 手機欄位只能輸入數字，最多10碼 */
        [
            memberForm.elements.phone,
            reservationForm.elements.phone,
            queryPhone,
            memberQueryPhone
        ].forEach(
            function (phoneInput) {

                phoneInput.addEventListener(
                    "input",
                    function () {

                        phoneInput.value = phoneInput.value
                            .replace(/\D/g, "")
                            .slice(0, 10);

                    }
                );

            }
        );

        /* =========================================
           預約查詢與取消預約（前端）
        ========================================= */

        function addResultDetail(container, label, value) {

            const item = document.createElement("p");
            const title = document.createElement("strong");

            title.textContent = label + "：";
            item.appendChild(title);
            item.appendChild(
                document.createTextNode(value || "未提供")
            );
            container.appendChild(item);

        }

        function renderReservationResults(reservations, name, phone) {

            queryResults.replaceChildren();

            if (!reservations.length) {

                const emptyMessage = document.createElement("p");
                emptyMessage.className = "query-empty";
                emptyMessage.textContent = "查無預約資料，請確認手機號碼是否正確。";
                queryResults.appendChild(emptyMessage);
                return;

            }

            reservations.forEach(
                function (reservation) {

                    const card = document.createElement("article");
                    card.className = "reservation-result-card";

                    const header = document.createElement("div");
                    header.className = "result-card-header";

                    const idText = document.createElement("strong");
                    idText.className = "result-id";
                    idText.textContent = "預約編號 " + (reservation.id || "未提供");

                    const statusText = document.createElement("span");
                    statusText.className = "result-status";
                    statusText.textContent = reservation.status || "待確認";

                    header.append(idText, statusText);

                    const details = document.createElement("div");
                    details.className = "result-details";

                    addResultDetail(details, "姓名", reservation.name);
                    addResultDetail(details, "服務項目", reservation.service);
                    addResultDetail(details, "預約日期", reservation.date);
                    addResultDetail(details, "預約時段", reservation.time);

                    card.append(header, details);

                    const cannotCancel =
                        ["已取消", "已完成"].includes(reservation.status);

                    const cancelButton = document.createElement("button");
                    cancelButton.type = "button";
                    cancelButton.className = "cancel-reservation-btn";
                    cancelButton.textContent = cannotCancel ? reservation.status : "取消這筆預約";
                    cancelButton.disabled = cannotCancel;

                    cancelButton.addEventListener(
                        "click",
                        function () {
                            requestCancellation(reservation, name, phone, cancelButton);
                        }
                    );

                    card.appendChild(cancelButton);
                    queryResults.appendChild(card);

                }
            );

        }

        async function requestReservationApi(payload) {

            const response = await fetch(
                APPS_SCRIPT_URL,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "text/plain;charset=utf-8"
                    },
                    body: JSON.stringify(payload),
                    redirect: "follow"
                }
            );

            if (!response.ok) {
                throw new Error("HTTP " + response.status);
            }

            try {
                return await response.json();
            } catch (parseError) {
                throw new Error("伺服器回傳格式錯誤，請稍後再試。");
            }

        }

        function showMemberQueryResult(message, type) {

            memberQueryResult.textContent = message;
            memberQueryResult.className =
                "member-query-result is-visible " + type;

        }

        async function runMemberQuery(name, phone) {

            if (!isApiUrlReady()) {
                showMemberQueryResult(
                    "尚未設定 API 網址，請先修改 APPS_SCRIPT_URL。",
                    "is-error"
                );
                return;
            }

            const submitButton =
                memberQueryForm.querySelector("button[type='submit']");

            submitButton.disabled = true;
            submitButton.textContent = "查詢中…";

            try {
                const result = await requestReservationApi({
                    action: "queryMember",
                    name: name,
                    phone: phone
                });

                if (result.success === false) {
                    throw new Error(result.message || "查詢失敗");
                }

                const exists =
                    result.exists === true ||
                    result.isMember === true ||
                    Boolean(result.member);

                const memberData = result.member || {};
                const balanceText = memberData.balance !== undefined
                    ? "目前儲值餘額：NT$ " + memberData.balance + "。"
                    : "";

                showMemberQueryResult(
                    exists
                        ? "查詢成功：「" + name + "」為有效會員。" + balanceText
                        : "查無符合的會員資料，目前尚未加入會員。",
                    exists ? "is-member" : "not-member"
                );

                memberQueryActions.hidden = false;
                queryMemberToReservationButton.hidden = !exists;
                queryMemberToRegisterButton.hidden = exists;

                if (exists) {
                    reservationForm.elements.name.value = name;
                    reservationForm.elements.phone.value = phone;
                    reservationForm.elements.email.value = memberData.email || "";
                }

            } catch (error) {
                memberQueryActions.hidden = true;
                showMemberQueryResult(
                    "會員查詢失敗：" + error.message,
                    "is-error"
                );
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = "查詢會員";
            }

        }

        async function runReservationQuery(name, phone) {

            if (!isApiUrlReady()) {
                showFormStatus(
                    queryStatus,
                    "尚未設定 API 網址，請先修改 APPS_SCRIPT_URL。",
                    "error"
                );
                return;
            }

            const submitButton =
                reservationQueryForm.querySelector("button[type='submit']");

            submitButton.disabled = true;
            submitButton.textContent = "查詢中…";

            try {

                const result = await requestReservationApi({
                    action: "queryReservation",
                    name: name,
                    phone: phone
                });

                if (result.success === false) {
                    throw new Error(result.message || "查詢失敗");
                }

                const allReservations = Array.isArray(result.reservations)
                    ? result.reservations
                    : (Array.isArray(result.data) ? result.data : []);

                const reservations = allReservations.filter(function (reservation) {
                    return !reservation.name ||
                        String(reservation.name).trim() === name;
                });

                renderReservationResults(reservations, name, phone);
                showFormStatus(
                    queryStatus,
                    reservations.length ? "查詢完成。" : "目前沒有預約紀錄。",
                    "success"
                );

            } catch (error) {
                showFormStatus(
                    queryStatus,
                    "查詢失敗：" + error.message,
                    "error"
                );
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = "查詢預約";
            }

        }

        function requestCancellation(reservation, name, phone, button) {
            if (!reservation.id) return;

            const detail = [reservation.date, reservation.time, reservation.service]
                .filter(Boolean)
                .join("・");

            cancelConfirmText.textContent = detail
                ? "確定取消「" + detail + "」的預約嗎？取消後如需服務，必須重新建立預約。"
                : "取消後如需服務，必須重新建立預約。";

            pendingCancellation = {
                id: reservation.id,
                name: name,
                phone: phone,
                button: button
            };
            cancelConfirmLayer.hidden = false;
            cancelConfirmBack.focus();
        }

        async function cancelReservation(id, name, phone, button) {

            button.disabled = true;
            button.textContent = "取消中…";

            try {
                const result = await requestReservationApi({
                    action: "cancelReservation",
                    id: id,
                    name: name,
                    phone: phone
                });

                if (result.success === false) {
                    throw new Error(result.message || "取消失敗");
                }

                showFormStatus(queryStatus, "預約已取消。", "success");
                await runReservationQuery(name, phone);

            } catch (error) {
                showFormStatus(
                    queryStatus,
                    "取消失敗：" + error.message,
                    "error"
                );
                button.disabled = false;
                button.textContent = "取消這筆預約";
            }

        }

        openQueryDialogButton.addEventListener(
            "click",
            function () {
                showMemberCenterPanel("open-query-dialog");
                queryPhone.focus();
            }
        );

        memberToReservationButton.addEventListener("click", function () {
            showMemberCenterPanel("open-reservation-form");
            reservationForm.elements.service.focus();
        });

        openMemberDialogButton.addEventListener(
            "click",
            function () {
                showMemberCenterPanel("open-member-dialog");
                memberForm.elements.name.focus();
            }
        );

        openMemberQueryButton.addEventListener(
            "click",
            function () {
                showMemberCenterPanel("open-member-query");
                memberQueryName.focus();
            }
        );

        openReservationFormButton.addEventListener(
            "click",
            function () {
                showMemberCenterPanel("open-reservation-form");
                reservationForm.elements.name.focus({ preventScroll: true });
            }
        );

        memberQueryForm.addEventListener(
            "submit",
            function (event) {
                event.preventDefault();

                const name = memberQueryName.value.trim();
                const phone = memberQueryPhone.value.replace(/\D/g, "");

                if (!name) {
                    showMemberQueryResult("請輸入會員姓名。", "is-error");
                    memberQueryName.focus();
                    return;
                }

                if (!/^09\d{8}$/.test(phone)) {
                    showMemberQueryResult(
                        "請輸入09開頭的10碼手機號碼。",
                        "is-error"
                    );
                    memberQueryPhone.focus();
                    return;
                }

                memberQueryPhone.value = phone;
                memberQueryActions.hidden = true;
                runMemberQuery(name, phone);
            }
        );

        queryMemberToReservationButton.addEventListener("click", function () {
            showMemberCenterPanel("open-reservation-form");
            reservationForm.elements.service.focus();
        });

        queryMemberToRegisterButton.addEventListener("click", function () {
            memberForm.elements.name.value = memberQueryName.value.trim();
            memberForm.elements.phone.value = memberQueryPhone.value;
            showMemberCenterPanel("open-member-dialog");
            memberForm.elements.name.focus();
        });

        cancelConfirmBack.addEventListener("click", function () {
            cancelConfirmLayer.hidden = true;
            if (pendingCancellation) pendingCancellation.button.focus();
            pendingCancellation = null;
        });

        cancelConfirmSubmit.addEventListener("click", function () {
            if (!pendingCancellation) return;
            const cancellation = pendingCancellation;
            pendingCancellation = null;
            cancelConfirmLayer.hidden = true;
            cancelReservation(
                cancellation.id,
                cancellation.name,
                cancellation.phone,
                cancellation.button
            );
        });

        reservationQueryForm.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();

                const name = queryName.value.trim();
                const phone = queryPhone.value.replace(/\D/g, "");

                if (!name) {
                    showFormStatus(queryStatus, "請輸入預約姓名。", "error");
                    queryName.focus();
                    return;
                }

                if (!/^09\d{8}$/.test(phone)) {
                    showFormStatus(
                        queryStatus,
                        "請輸入09開頭的10碼手機號碼。",
                        "error"
                    );
                    return;
                }

                queryPhone.value = phone;
                runReservationQuery(name, phone);

            }
        );

        const aboutMainImage =
            document.querySelector(
                ".about-main-image"
            );

        const aboutGallery =
            document.querySelector(
                ".about-gallery"
            );

        const aboutThumbnails =
            Array.from(document.querySelectorAll(
                ".about-thumbnail"
            ));

        const aboutDots =
            Array.from(document.querySelectorAll(
                ".about-dot"
            ));

        let currentAboutImage = 0;

        let aboutAutoTimer = null;

        let aboutWheelLocked = false;

        /* =========================================
           關於弌照片切換
        ========================================= */

        function restartAboutAutoplay() {

            window.clearTimeout(aboutAutoTimer);

            if (aboutMainImage.matches(":hover")) {
                return;
            }

            aboutAutoTimer = window.setTimeout(
                function () {

                    showAboutImage(
                        currentAboutImage + 1,
                        false
                    );

                    restartAboutAutoplay();

                },
                3000
            );

        }

        function showAboutImage(index, resetAutoplay = true) {

            const totalImages =
                aboutThumbnails.length;

            currentAboutImage =
                (index + totalImages) % totalImages;

            const selectedThumbnail =
                aboutThumbnails[currentAboutImage];

            const nextImage =
                selectedThumbnail.dataset.image;

            const nextAlt =
                selectedThumbnail.dataset.alt;

            aboutMainImage.classList.add(
                "is-changing"
            );

            const imageLoader = new Image();

            imageLoader.src = nextImage;

            imageLoader.onload = function () {

                aboutMainImage.src = nextImage;
                aboutMainImage.alt = nextAlt;

                aboutMainImage.classList.remove(
                    "is-changing"
                );

            };

            imageLoader.onerror = function () {

                aboutMainImage.classList.remove(
                    "is-changing"
                );

            };

            aboutThumbnails.forEach(
                function (item, itemIndex) {

                    item.classList.toggle(
                        "is-active",
                        itemIndex === currentAboutImage
                    );

                }
            );

            aboutDots.forEach(
                function (dot, dotIndex) {

                    dot.classList.toggle(
                        "is-active",
                        dotIndex === currentAboutImage
                    );

                }
            );

            const thumbnailStrip =
                selectedThumbnail.parentElement;

            if (thumbnailStrip.scrollWidth > thumbnailStrip.clientWidth) {

                const thumbnailLeft =
                    currentAboutImage <= 1
                        ? 0
                        : thumbnailStrip.scrollLeft
                            + selectedThumbnail.getBoundingClientRect().left
                            - thumbnailStrip.getBoundingClientRect().left
                            - (thumbnailStrip.clientWidth
                                - selectedThumbnail.clientWidth) / 2;

                thumbnailStrip.scrollTo({
                    left: thumbnailLeft,
                    behavior: "smooth"
                });

            }

            if (resetAutoplay) {

                restartAboutAutoplay();

            }

        }

        aboutThumbnails.forEach(
            function (thumbnail, index) {

                thumbnail.addEventListener(
                    "click",
                    function () {

                        showAboutImage(index);

                    }
                );

            }
        );

        aboutDots.forEach(
            function (dot) {

                dot.addEventListener(
                    "click",
                    function () {

                        showAboutImage(
                            Number(dot.dataset.index)
                        );

                    }
                );

            }
        );

        aboutMainImage.addEventListener(
            "wheel",
            function (event) {

                event.preventDefault();

                if (aboutWheelLocked) {

                    return;

                }

                aboutWheelLocked = true;

                if (event.deltaY > 0) {

                    showAboutImage(
                        currentAboutImage + 1
                    );

                } else {

                    showAboutImage(
                        currentAboutImage - 1
                    );

                }

                window.setTimeout(
                    function () {

                        aboutWheelLocked = false;

                    },
                    450
                );

            },
            { passive: false }
        );

        aboutMainImage.addEventListener(
            "mouseenter",
            function () {
                window.clearTimeout(aboutAutoTimer);
            }
        );

        aboutMainImage.addEventListener(
            "mouseleave",
            restartAboutAutoplay
        );

        document.addEventListener(
            "keydown",
            function (event) {

                if (!["ArrowLeft", "ArrowRight"].includes(event.key)) {

                    return;

                }

                const activeTag =
                    document.activeElement.tagName;

                if (["INPUT", "TEXTAREA", "SELECT"].includes(activeTag)) {

                    return;

                }

                const galleryRect =
                    aboutGallery.getBoundingClientRect();

                const galleryIsVisible =
                    galleryRect.top < window.innerHeight * 0.8
                    && galleryRect.bottom > window.innerHeight * 0.2;

                if (!galleryIsVisible) {

                    return;

                }

                event.preventDefault();

                const step =
                    event.key === "ArrowRight" ? 1 : -1;

                showAboutImage(
                    currentAboutImage + step
                );

            }
        );

        document.addEventListener(
            "visibilitychange",
            function () {

                if (document.hidden) {

                    window.clearTimeout(aboutAutoTimer);

                } else {

                    restartAboutAutoplay();

                }

            }
        );

        restartAboutAutoplay();

        /* =========================================
           手機選單
        ========================================= */

        menuToggle.addEventListener(
            "click",
            function () {

                const isOpen =
                    navList.classList.toggle(
                        "is-open"
                    );

                menuToggle.setAttribute(
                    "aria-expanded",
                    isOpen
                );

            }
        );

        navLinks.forEach(
            function (link) {

                link.addEventListener(
                    "click",
                    function () {

                        navList.classList.remove(
                            "is-open"
                        );

                        menuToggle.setAttribute(
                            "aria-expanded",
                            "false"
                        );

                    }
                );

            }
        );

        /* =========================================
           捲動效果
        ========================================= */

        window.addEventListener(
            "scroll",
            function () {

                if (window.scrollY > 50) {

                    header.classList.add(
                        "is-scrolled"
                    );

                } else {

                    header.classList.remove(
                        "is-scrolled"
                    );

                }

                if (window.scrollY > 600) {

                    backToTop.classList.add(
                        "is-visible"
                    );

                } else {

                    backToTop.classList.remove(
                        "is-visible"
                    );

                }

                const isNearPageBottom =
                    window.innerHeight + window.scrollY
                    >= document.documentElement.scrollHeight - 120;

                backToBottom.classList.toggle(
                    "is-visible",
                    !isNearPageBottom
                );

            }
        );

        /* =========================================
           FAQ
        ========================================= */

        faqButtons.forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const answer =
                            button
                                .closest(
                                    ".faq-item"
                                )
                                .querySelector(
                                    ".faq-answer"
                                );

                        const isOpen =
                            button.getAttribute(
                                "aria-expanded"
                            ) === "true";

                        faqButtons.forEach(
                            function (other) {

                                other.setAttribute(
                                    "aria-expanded",
                                    "false"
                                );

                                const otherAnswer =
                                    other
                                        .closest(
                                            ".faq-item"
                                        )
                                        .querySelector(
                                            ".faq-answer"
                                        );

                                otherAnswer.style.maxHeight =
                                    null;

                            }
                        );

                        if (!isOpen) {

                            button.setAttribute(
                                "aria-expanded",
                                "true"
                            );

                            answer.style.maxHeight =
                                answer.scrollHeight
                                + "px";

                        }

                    }
                );

            }
        );
