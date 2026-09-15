import {
  auth,
  db,
  storage
} from "../../core/firebase/firebase-config.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js";

import {
  createLoadingScreen,
  showLoading,
  hideLoading
} from "../../core/loading.js";


/* =====================================================
   CONFIG
===================================================== */

const BANNERS_COLLECTION = "zenovaV2Banners";

const BANNER_STORAGE_PATH = "zenovaV2Banners";


/* =====================================================
   STATE
===================================================== */

let currentUser = null;

let banners = [];

let editingBannerId = null;

let editingBannerData = null;

let selectedSource = "upload";

let selectedFile = null;

let unsubscribeBanners = null;


/* =====================================================
   DOM
===================================================== */

const bannerList =
  document.getElementById("bannerList");

const emptyState =
  document.getElementById("emptyState");

const bannerListSection =
  document.getElementById("bannerListSection");

const bannerFormSection =
  document.getElementById("bannerFormSection");

const bannerForm =
  document.getElementById("bannerForm");

const formTitle =
  document.getElementById("formTitle");

const googleDummy = null;

const bannerFile =
  document.getElementById("bannerFile");

const bannerUrl =
  document.getElementById("bannerUrl");

const uploadSource =
  document.getElementById("uploadSource");

const urlSource =
  document.getElementById("urlSource");

const uploadTab =
  document.getElementById("uploadTab");

const urlTab =
  document.getElementById("urlTab");

const previewContainer =
  document.getElementById("previewContainer");

const bannerPreview =
  document.getElementById("bannerPreview");

const imageDimensions =
  document.getElementById("imageDimensions");

const bannerTitle =
  document.getElementById("bannerTitle");

const bannerDescription =
  document.getElementById("bannerDescription");

const buttonText =
  document.getElementById("buttonText");

const buttonLink =
  document.getElementById("buttonLink");

const priority =
  document.getElementById("priority");

const active =
  document.getElementById("active");

const formMessage =
  document.getElementById("formMessage");

const saveButton =
  document.getElementById("saveButton");


/* =====================================================
   LOADING
===================================================== */

createLoadingScreen();


/* =====================================================
   AUTH
===================================================== */

onAuthStateChanged(
  auth,
  user => {

    currentUser = user || null;

    /*
     * Login is intentionally not enforced yet.
     *
     * When Admin authentication is introduced,
     * this module can call the centralized admin
     * authorization layer here.
     */

    hideLoading();

    startBannerListener();
  }
);


/* =====================================================
   FIRESTORE
===================================================== */

function startBannerListener() {

  if (unsubscribeBanners) {
    unsubscribeBanners();
  }

  const bannersRef =
    collection(db, BANNERS_COLLECTION);

  const bannersQuery =
    query(
      bannersRef,
      orderBy("priority", "asc")
    );

  unsubscribeBanners =
    onSnapshot(
      bannersQuery,

      snapshot => {

        banners =
          snapshot.docs.map(item => ({
            id: item.id,
            ...item.data()
          }));

        renderBanners();
      },

      error => {

        console.error(
          "Banner listener error:",
          error
        );

        showEmptyError();
      }
    );
}


/* =====================================================
   RENDER BANNERS
===================================================== */

function renderBanners() {

  bannerList.innerHTML = "";

  if (!banners.length) {

    emptyState.hidden = false;

    return;
  }

  emptyState.hidden = true;


  banners.forEach(banner => {

    const card =
      document.createElement("article");

    card.className = "banner-card";


    const imageUrl =
      banner.imageUrl || "";


    card.innerHTML = `

      <div class="banner-image-wrap">

        ${
          imageUrl
            ? `
              <img
                src="${escapeAttribute(imageUrl)}"
                alt="${escapeAttribute(
                  banner.title || "Zenova banner"
                )}"
                loading="lazy"
              >
            `
            : `
              <div
                style="
                  width:100%;
                  height:100%;
                  display:flex;
                  align-items:center;
                  justify-content:center;
                  color:#999;
                  font-size:13px;
                "
              >
                No image
              </div>
            `
        }

      </div>


      <div class="banner-card-body">

        <div class="banner-card-top">

          <div class="banner-info">

            ${
              banner.title
                ? `
                  <div class="banner-title">
                    ${escapeHtml(banner.title)}
                  </div>
                `
                : `
                  <div class="banner-title empty">
                    Image-only banner
                  </div>
                `
            }


            ${
              banner.description
                ? `
                  <div class="banner-description">
                    ${escapeHtml(
                      banner.description
                    )}
                  </div>
                `
                : ""
            }


            <div class="banner-meta">

              <span class="meta-pill">
                Priority ${Number(
                  banner.priority ?? 0
                )}
              </span>

              <span class="
                meta-pill
                ${
                  banner.active === false
                    ? "status-inactive"
                    : "status-active"
                }
              ">
                ${
                  banner.active === false
                    ? "Inactive"
                    : "Active"
                }
              </span>

              ${
                banner.source === "URL"
                  ? `
                    <span class="meta-pill">
                      URL
                    </span>
                  `
                  : `
                    <span class="meta-pill">
                      Uploaded
                    </span>
                  `
              }

            </div>


            ${
              banner.buttonText
                ? `
                  <div class="banner-description">
                    Button:
                    ${escapeHtml(
                      banner.buttonText
                    )}
                  </div>
                `
                : ""
            }


            ${
              banner.buttonLink
                ? `
                  <a
                    class="banner-link"
                    href="${escapeAttribute(
                      banner.buttonLink
                    )}"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    ${escapeHtml(
                      banner.buttonLink
                    )}
                  </a>
                `
                : ""
            }

          </div>


          <div class="banner-actions">

            <button
              type="button"
              class="icon-button"
              data-action="edit"
              data-id="${banner.id}"
              title="Edit"
            >
              ✎
            </button>

            <button
              type="button"
              class="icon-button delete"
              data-action="delete"
              data-id="${banner.id}"
              title="Delete"
            >
              ×
            </button>

          </div>

        </div>

      </div>

    `;


    bannerList.appendChild(card);
  });
}


/* =====================================================
   OPEN FORM
===================================================== */

function openForm(banner = null) {

  bannerListSection.hidden = true;

  bannerFormSection.hidden = false;

  editingBannerId =
    banner ? banner.id : null;

  editingBannerData =
    banner ? { ...banner } : null;

  clearMessage();

  selectedFile = null;

  if (banner) {

    formTitle.textContent =
      "Edit Banner";

    bannerTitle.value =
      banner.title || "";

    bannerDescription.value =
      banner.description || "";

    buttonText.value =
      banner.buttonText || "";

    buttonLink.value =
      banner.buttonLink || "";

    priority.value =
      Number(banner.priority ?? 0);

    active.checked =
      banner.active !== false;


    if (
      banner.source === "URL" &&
      banner.imageUrl
    ) {

      setSource("url");

      bannerUrl.value =
        banner.imageUrl;

      showPreview(
        banner.imageUrl
      );

    } else {

      setSource("upload");

      if (banner.imageUrl) {
        showPreview(
          banner.imageUrl
        );
      }
    }

  } else {

    formTitle.textContent =
      "Add Banner";

    resetForm();

  }

}


/* =====================================================
   CLOSE FORM
===================================================== */

function closeForm() {

  bannerFormSection.hidden = true;

  bannerListSection.hidden = false;

  editingBannerId = null;

  editingBannerData = null;

  selectedFile = null;

  resetForm();

}


/* =====================================================
   RESET
===================================================== */

function resetForm() {

  bannerForm.reset();

  priority.value = "0";

  active.checked = true;

  selectedFile = null;

  setSource("upload");

  hidePreview();

  clearMessage();
}


/* =====================================================
   SOURCE SWITCH
===================================================== */

function setSource(source) {

  selectedSource = source;

  if (source === "upload") {

    uploadTab.classList.add("active");
    urlTab.classList.remove("active");

    uploadSource.hidden = false;
    urlSource.hidden = true;

  } else {

    uploadTab.classList.remove("active");
    urlTab.classList.add("active");

    uploadSource.hidden = true;
    urlSource.hidden = false;
  }
}


/* =====================================================
   FILE SELECT
===================================================== */

bannerFile.addEventListener(
  "change",
  event => {

    const file =
      event.target.files?.[0];

    if (!file) return;


    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/webp"
    ];

    if (!validTypes.includes(file.type)) {

      showMessage(
        "Please select a JPG, PNG or WEBP image.",
        "error"
      );

      bannerFile.value = "";

      return;
    }


    selectedFile = file;

    const localUrl =
      URL.createObjectURL(file);

    showPreview(localUrl);

    checkImageDimensions(localUrl);
  }
);


/* =====================================================
   URL PREVIEW
===================================================== */

bannerUrl.addEventListener(
  "input",
  () => {

    const url =
      bannerUrl.value.trim();

    if (!url) {

      hidePreview();

      return;
    }

    showPreview(url);

    checkImageDimensions(url);
  }
);


/* =====================================================
   IMAGE PREVIEW
===================================================== */

function showPreview(url) {

  bannerPreview.src = url;

  previewContainer.hidden = false;

  bannerPreview.onload = () => {

    imageDimensions.textContent =
      `${bannerPreview.naturalWidth} × ${bannerPreview.naturalHeight}px`;

  };

  bannerPreview.onerror = () => {

    imageDimensions.textContent =
      "Unable to load this image.";

  };
}


function hidePreview() {

  previewContainer.hidden = true;

  bannerPreview.src = "";

  imageDimensions.textContent = "";
}


function checkImageDimensions(url) {

  const image =
    new Image();

  image.onload = () => {

    imageDimensions.textContent =
      `${image.naturalWidth} × ${image.naturalHeight}px`;

  };

  image.onerror = () => {

    imageDimensions.textContent =
      "Unable to load image.";
  };

  image.src = url;
}


/* =====================================================
   SAVE
===================================================== */

bannerForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();

    clearMessage();


    const title =
      bannerTitle.value.trim();

    const description =
      bannerDescription.value.trim();

    const text =
      buttonText.value.trim();

    const link =
      buttonLink.value.trim();

    const priorityValue =
      Number(priority.value) || 0;

    const isActive =
      active.checked;


    /*
     * IMAGE IS THE ONLY REQUIRED FIELD.
     *
     * For a new banner:
     * either upload a file OR provide URL.
     *
     * For an existing banner:
     * the existing image can remain.
     */

    if (
      !selectedFile &&
      !bannerUrl.value.trim() &&
      !editingBannerData?.imageUrl
    ) {

      showMessage(
        "Please upload a banner image or enter a banner URL.",
        "error"
      );

      return;
    }


    try {

      saveButton.disabled = true;

      saveButton.textContent =
        "Saving...";


      let imageUrl =
        editingBannerData?.imageUrl || "";

      let storagePath =
        editingBannerData?.storagePath || "";

      let source =
        editingBannerData?.source || "URL";


      /* -----------------------------------------------
         UPLOAD IMAGE
      ------------------------------------------------ */

      if (
        selectedSource === "upload" &&
        selectedFile
      ) {

        const extension =
          getExtension(
            selectedFile.name
          );

        const uniqueName =
          `${Date.now()}_${crypto.randomUUID()}.${extension}`;

        storagePath =
          `${BANNER_STORAGE_PATH}/${uniqueName}`;

        const storageRef =
          ref(
            storage,
            storagePath
          );

        await uploadBytes(
          storageRef,
          selectedFile,
          {
            contentType:
              selectedFile.type
          }
        );

        imageUrl =
          await getDownloadURL(
            storageRef
          );

        source = "UPLOAD";
      }


      /* -----------------------------------------------
         URL
      ------------------------------------------------ */

      if (
        selectedSource === "url" &&
        bannerUrl.value.trim()
      ) {

        imageUrl =
          bannerUrl.value.trim();

        source = "URL";

        /*
         * If changing from an uploaded image
         * to URL, remove the old storage reference.
         */
        if (
          editingBannerData?.storagePath
        ) {

          await safelyDeleteStorageFile(
            editingBannerData.storagePath
          );

          storagePath = "";
        }
      }


      /* -----------------------------------------------
         DATA
      ------------------------------------------------ */

      const bannerData = {

        imageUrl,

        source,

        storagePath,

        title,

        description,

        buttonText: text,

        buttonLink: link,

        priority: priorityValue,

        active: isActive,

        updatedAt:
          serverTimestamp(),

        updatedBy:
          currentUser?.uid || null
      };


      /* -----------------------------------------------
         UPDATE
      ------------------------------------------------ */

      if (editingBannerId) {

        await updateDoc(
          doc(
            db,
            BANNERS_COLLECTION,
            editingBannerId
          ),
          bannerData
        );

      }

      /* -----------------------------------------------
         CREATE
      ------------------------------------------------ */

      else {

        await addDoc(
          collection(
            db,
            BANNERS_COLLECTION
          ),
          {
            ...bannerData,

            createdAt:
              serverTimestamp(),

            createdBy:
              currentUser?.uid || null
          }
        );
      }


      closeForm();

    } catch (error) {

      console.error(
        "Save banner error:",
        error
      );

      showMessage(
        getFirebaseErrorMessage(error),
        "error"
      );

    } finally {

      saveButton.disabled = false;

      saveButton.textContent =
        editingBannerId
          ? "Save Changes"
          : "Save Banner";
    }
  }
);


/* =====================================================
   DELETE
===================================================== */

async function deleteBanner(id) {

  const banner =
    banners.find(
      item => item.id === id
    );

  if (!banner) return;


  const confirmed =
    window.confirm(
      "Delete this banner? This action cannot be undone."
    );

  if (!confirmed) return;


  try {

    showLoading();


    await deleteDoc(
      doc(
        db,
        BANNERS_COLLECTION,
        id
      )
    );


    if (banner.storagePath) {

      await safelyDeleteStorageFile(
        banner.storagePath
      );
    }

  } catch (error) {

    console.error(
      "Delete banner error:",
      error
    );

    alert(
      getFirebaseErrorMessage(error)
    );

  } finally {

    hideLoading();
  }
}


/* =====================================================
   STORAGE DELETE
===================================================== */

async function safelyDeleteStorageFile(
  storagePath
) {

  if (!storagePath) return;

  try {

    const fileRef =
      ref(
        storage,
        storagePath
      );

    await deleteObject(
      fileRef
    );

  } catch (error) {

    /*
     * If the Storage file is already gone,
     * don't block deleting/updating Firestore.
     */

    console.warn(
      "Storage file could not be deleted:",
      error
    );
  }
}


/* =====================================================
   EVENTS
===================================================== */

document
  .getElementById("addBannerButton")
  .addEventListener(
    "click",
    () => openForm()
  );


document
  .getElementById("emptyAddButton")
  .addEventListener(
    "click",
    () => openForm()
  );


document
  .getElementById("closeFormButton")
  .addEventListener(
    "click",
    closeForm
  );


document
  .getElementById("cancelButton")
  .addEventListener(
    "click",
    closeForm
  );


document
  .getElementById("backButton")
  .addEventListener(
    "click",
    () => {

      if (!bannerFormSection.hidden) {

        closeForm();

      } else {

        window.location.href =
          "../";
      }
    }
  );


uploadTab.addEventListener(
  "click",
  () => setSource("upload")
);


urlTab.addEventListener(
  "click",
  () => setSource("url")
);


bannerList.addEventListener(
  "click",
  event => {

    const button =
      event.target.closest(
        "[data-action]"
      );

    if (!button) return;


    const action =
      button.dataset.action;

    const id =
      button.dataset.id;


    const banner =
      banners.find(
        item => item.id === id
      );


    if (action === "edit" && banner) {

      openForm(banner);
    }


    if (action === "delete") {

      deleteBanner(id);
    }
  }
);


/* =====================================================
   HELPERS
===================================================== */

function getExtension(filename) {

  const parts =
    filename.split(".");

  return (
    parts.length > 1
      ? parts.pop().toLowerCase()
      : "jpg"
  );
}


function showMessage(
  text,
  type = "error"
) {

  formMessage.textContent = text;

  formMessage.className =
    `form-message ${type}`;

  formMessage.hidden = false;
}


function clearMessage() {

  formMessage.textContent = "";

  formMessage.className =
    "form-message";

  formMessage.hidden = true;
}


function showEmptyError() {

  bannerList.innerHTML = `
    <div class="empty-state">

      <div class="empty-icon">
        !
      </div>

      <h2>
        Unable to load banners
      </h2>

      <p>
        Please check your Firebase connection
        and try again.
      </p>

    </div>
  `;

  emptyState.hidden = true;
}


function escapeHtml(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function escapeAttribute(value) {

  return escapeHtml(value);
}


function getFirebaseErrorMessage(error) {

  if (!error) {
    return "Something went wrong.";
  }

  if (
    error.code ===
    "storage/unauthorized"
  ) {
    return "Firebase Storage permission denied.";
  }

  if (
    error.code ===
    "storage/cors-unsupported"
  ) {
    return "Firebase Storage CORS configuration is blocking this upload.";
  }

  if (
    error.code ===
    "permission-denied"
  ) {
    return "Firebase permission denied.";
  }

  return (
    error.message ||
    "Unable to save the banner."
  );
}
