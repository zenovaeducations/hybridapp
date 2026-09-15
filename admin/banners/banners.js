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
  doc,
  updateDoc,
  deleteDoc,
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

import {
  getCurrentAdmin
} from "../../core/admin.js";


/* =====================================================
   CONFIGURATION
===================================================== */

const BANNERS_COLLECTION = "zenovaV2Banners";

const STORAGE_FOLDER = "zenovaV2/banners";

const MIN_WIDTH = 1200;
const MIN_HEIGHT = 450;

const RECOMMENDED_WIDTH = 1920;
const RECOMMENDED_HEIGHT = 720;


/* =====================================================
   STATE
===================================================== */

let banners = [];

let currentEditId = null;

let currentDeleteId = null;

let selectedImageFile = null;

let existingImageUrl = "";

let existingStoragePath = "";

let unsubscribeBanners = null;


/* =====================================================
   DOM
===================================================== */

const bannerList =
  document.getElementById("bannerList");

const bannerLoading =
  document.getElementById("bannerLoading");

const bannerEmpty =
  document.getElementById("bannerEmpty");

const bannerModal =
  document.getElementById("bannerModal");

const deleteModal =
  document.getElementById("deleteModal");

const bannerForm =
  document.getElementById("bannerForm");

const bannerImage =
  document.getElementById("bannerImage");

const uploadArea =
  document.getElementById("uploadArea");

const uploadPlaceholder =
  document.getElementById("uploadPlaceholder");

const imagePreviewWrapper =
  document.getElementById("imagePreviewWrapper");

const imagePreview =
  document.getElementById("imagePreview");

const imageInfo =
  document.getElementById("imageInfo");

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

const formError =
  document.getElementById("formError");

const modalTitle =
  document.getElementById("modalTitle");

const saveButton =
  document.getElementById("saveButton");


/* =====================================================
   INITIALIZE
===================================================== */

createLoadingScreen();

initialize();


async function initialize() {

  showLoading();

  onAuthStateChanged(
    auth,
    async (user) => {

      if (!user) {

        /*
         * There is intentionally no Admin login screen
         * at this stage.
         *
         * Authentication/role protection can be enabled
         * centrally later through core/admin.js.
         */

        console.warn(
          "No authenticated admin session."
        );
      }

      try {

        startBannerListener();

      } catch (error) {

        console.error(
          "Banner initialization failed:",
          error
        );

        showErrorState(
          "Unable to load banners."
        );

      } finally {

        hideLoading();
      }
    }
  );
}


/* =====================================================
   FIRESTORE LISTENER
===================================================== */

function startBannerListener() {

  if (unsubscribeBanners) {
    unsubscribeBanners();
  }

  const bannersRef =
    collection(
      db,
      BANNERS_COLLECTION
    );

  const bannersQuery =
    query(
      bannersRef,
      orderBy("priority", "asc")
    );

  unsubscribeBanners =
    onSnapshot(
      bannersQuery,

      (snapshot) => {

        banners =
          snapshot.docs.map(
            (item) => ({
              id: item.id,
              ...item.data()
            })
          );

        /*
         * If multiple banners have the same priority,
         * newest updated banner comes later.
         */
        banners.sort(
          (a, b) => {

            const priorityA =
              Number.isFinite(Number(a.priority))
                ? Number(a.priority)
                : 999999;

            const priorityB =
              Number.isFinite(Number(b.priority))
                ? Number(b.priority)
                : 999999;

            if (priorityA !== priorityB) {
              return priorityA - priorityB;
            }

            const timeA =
              getTimestampValue(
                a.updatedAt || a.createdAt
              );

            const timeB =
              getTimestampValue(
                b.updatedAt || b.createdAt
              );

            return timeB - timeA;
          }
        );

        renderBanners();
      },

      (error) => {

        console.error(
          "Firestore banner listener error:",
          error
        );

        showErrorState(
          "Unable to load banners. Check your Firebase permissions."
        );
      }
    );
}


/* =====================================================
   RENDER
===================================================== */

function renderBanners() {

  bannerLoading.classList.add("hidden");

  bannerList.innerHTML = "";

  if (!banners.length) {

    bannerList.classList.add("hidden");

    bannerEmpty.classList.remove("hidden");

    return;
  }

  bannerEmpty.classList.add("hidden");

  bannerList.classList.remove("hidden");


  banners.forEach(
    (banner) => {

      const card =
        document.createElement("article");

      card.className = "banner-card";

      const title =
        escapeHtml(
          banner.title || ""
        );

      const description =
        escapeHtml(
          banner.description || ""
        );

      const button =
        escapeHtml(
          banner.buttonText || ""
        );

      const isActive =
        banner.active !== false;


      card.innerHTML = `
        <div class="banner-image-container">

          <img
            class="banner-image"
            src="${escapeAttribute(
              banner.imageUrl || ""
            )}"
            alt="${title || "Zenova banner"}"
            loading="lazy"
          >

          <div
            class="banner-status ${
              isActive
                ? "active"
                : "inactive"
            }"
          >
            ${isActive ? "● Active" : "○ Inactive"}
          </div>

        </div>

        <div class="banner-details">

          ${
            title
              ? `
                <div class="banner-title">
                  ${title}
                </div>
              `
              : `
                <div class="banner-no-title">
                  Image-only banner
                </div>
              `
          }

          ${
            description
              ? `
                <div class="banner-description">
                  ${description}
                </div>
              `
              : ""
          }

          <div class="banner-meta">

            <span class="meta-pill">
              Priority:
              ${
                Number.isFinite(
                  Number(banner.priority)
                )
                  ? Number(banner.priority)
                  : "—"
              }
            </span>

            ${
              button
                ? `
                  <span class="meta-pill">
                    Button: ${button}
                  </span>
                `
                : ""
            }

          </div>


          <div class="banner-actions">

            <button
              type="button"
              class="small-button"
              data-action="toggle"
              data-id="${banner.id}"
            >
              ${
                isActive
                  ? "Hide"
                  : "Show"
              }
            </button>

            <button
              type="button"
              class="small-button"
              data-action="edit"
              data-id="${banner.id}"
            >
              Edit
            </button>

            <button
              type="button"
              class="small-button danger"
              data-action="delete"
              data-id="${banner.id}"
            >
              Delete
            </button>

          </div>

        </div>
      `;

      bannerList.appendChild(card);
    }
  );
}


/* =====================================================
   OPEN ADD MODAL
===================================================== */

function openAddModal() {

  currentEditId = null;

  selectedImageFile = null;

  existingImageUrl = "";

  existingStoragePath = "";

  modalTitle.textContent =
    "Add Banner";

  saveButton.textContent =
    "Save Banner";

  bannerForm.reset();

  active.checked = true;

  priority.value = "";

  resetImagePreview();

  clearFormError();

  bannerModal.classList.remove("hidden");
}


/* =====================================================
   OPEN EDIT MODAL
===================================================== */

function openEditModal(id) {

  const banner =
    banners.find(
      (item) => item.id === id
    );

  if (!banner) return;

  currentEditId = id;

  selectedImageFile = null;

  existingImageUrl =
    banner.imageUrl || "";

  existingStoragePath =
    banner.storagePath || "";

  modalTitle.textContent =
    "Edit Banner";

  saveButton.textContent =
    "Update Banner";

  bannerTitle.value =
    banner.title || "";

  bannerDescription.value =
    banner.description || "";

  buttonText.value =
    banner.buttonText || "";

  buttonLink.value =
    banner.buttonLink || "";

  priority.value =
    banner.priority !== undefined
      ? banner.priority
      : "";

  active.checked =
    banner.active !== false;

  clearFormError();

  if (existingImageUrl) {

    imagePreview.src =
      existingImageUrl;

    uploadPlaceholder.classList.add(
      "hidden"
    );

    imagePreviewWrapper.classList.remove(
      "hidden"
    );

  } else {

    resetImagePreview();
  }

  imageInfo.textContent =
    "Current banner image";

  bannerModal.classList.remove(
    "hidden"
  );
}


/* =====================================================
   IMAGE SELECT
===================================================== */

uploadArea.addEventListener(
  "click",
  (event) => {

    if (
      event.target.closest(
        "#changeImageButton"
      )
    ) {
      return;
    }

    bannerImage.click();
  }
);


document
  .getElementById("changeImageButton")
  .addEventListener(
    "click",
    (event) => {

      event.stopPropagation();

      bannerImage.click();
    }
  );


bannerImage.addEventListener(
  "change",
  async () => {

    const file =
      bannerImage.files?.[0];

    if (!file) return;

    clearFormError();

    if (!file.type.startsWith("image/")) {

      showFormError(
        "Please select a valid image."
      );

      bannerImage.value = "";

      return;
    }


    const maxSize =
      10 * 1024 * 1024;

    if (file.size > maxSize) {

      showFormError(
        "Banner image must be smaller than 10 MB."
      );

      bannerImage.value = "";

      return;
    }


    try {

      const dimensions =
        await getImageDimensions(file);

      const width =
        dimensions.width;

      const height =
        dimensions.height;


      if (
        width < MIN_WIDTH ||
        height < MIN_HEIGHT
      ) {

        showFormError(
          `Banner image is too small. Minimum recommended dimensions are ${MIN_WIDTH} × ${MIN_HEIGHT}px.`
        );

        bannerImage.value = "";

        return;
      }


      selectedImageFile = file;

      imagePreview.src =
        URL.createObjectURL(file);

      uploadPlaceholder.classList.add(
        "hidden"
      );

      imagePreviewWrapper.classList.remove(
        "hidden"
      );


      const ratio =
        width / height;

      const recommendedRatio =
        RECOMMENDED_WIDTH /
        RECOMMENDED_HEIGHT;

      const ratioDifference =
        Math.abs(
          ratio - recommendedRatio
        );


      imageInfo.textContent =
        `${width} × ${height}px • ${formatBytes(file.size)}`;


      if (ratioDifference > 0.08) {

        imageInfo.textContent +=
          " • Recommended aspect ratio is 8:3.";
      }

    } catch (error) {

      console.error(
        "Image validation error:",
        error
      );

      showFormError(
        "Unable to read this image."
      );
    }
  }
);


/* =====================================================
   SAVE
===================================================== */

bannerForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    clearFormError();


    /*
     * IMAGE IS THE ONLY REQUIRED FIELD.
     *
     * When editing, an existing image is also valid.
     */
    if (
      !selectedImageFile &&
      !existingImageUrl
    ) {

      showFormError(
        "Banner image is required."
      );

      return;
    }


    const user =
      getCurrentAdmin() ||
      auth.currentUser;


    if (!user) {

      showFormError(
        "No authenticated Firebase user is available."
      );

      return;
    }


    const data = {

      title:
        bannerTitle.value.trim(),

      description:
        bannerDescription.value.trim(),

      buttonText:
        buttonText.value.trim(),

      buttonLink:
        buttonLink.value.trim(),

      priority:
        priority.value.trim() === ""
          ? 0
          : Number(priority.value),

      active:
        active.checked
    };


    if (
      !Number.isFinite(
        data.priority
      ) ||
      data.priority < 0
    ) {

      showFormError(
        "Priority must be a valid number."
      );

      return;
    }


    try {

      showLoading();

      saveButton.disabled = true;

      saveButton.textContent =
        currentEditId
          ? "Updating..."
          : "Saving...";


      let imageUrl =
        existingImageUrl;

      let storagePath =
        existingStoragePath;


      /*
       * Upload a new image only when
       * Admin selected one.
       */
      if (selectedImageFile) {

        const extension =
          getFileExtension(
            selectedImageFile.name
          );

        const uniqueName =
          `${Date.now()}_${crypto.randomUUID()}${extension}`;

        storagePath =
          `${STORAGE_FOLDER}/${uniqueName}`;

        const storageRef =
          ref(
            storage,
            storagePath
          );

        await uploadBytes(
          storageRef,
          selectedImageFile,
          {
            contentType:
              selectedImageFile.type,

            cacheControl:
              "public,max-age=31536000"
          }
        );

        imageUrl =
          await getDownloadURL(
            storageRef
          );


        /*
         * If editing and the old image has
         * a known Storage path, remove it.
         */
        if (
          currentEditId &&
          existingStoragePath &&
          existingStoragePath !== storagePath
        ) {

          await safelyDeleteStorageFile(
            existingStoragePath
          );
        }
      }


      if (currentEditId) {

        const bannerRef =
          doc(
            db,
            BANNERS_COLLECTION,
            currentEditId
          );

        await updateDoc(
          bannerRef,
          {
            ...data,

            imageUrl,

            storagePath,

            updatedAt:
              serverTimestamp(),

            updatedBy:
              user.uid
          }
        );

      } else {

        await addDoc(
          collection(
            db,
            BANNERS_COLLECTION
          ),
          {
            ...data,

            imageUrl,

            storagePath,

            createdAt:
              serverTimestamp(),

            createdBy:
              user.uid,

            updatedAt:
              serverTimestamp(),

            updatedBy:
              user.uid
          }
        );
      }


      closeBannerModal();

    } catch (error) {

      console.error(
        "Saving banner failed:",
        error
      );

      showFormError(
        getReadableFirebaseError(error)
      );

    } finally {

      saveButton.disabled = false;

      saveButton.textContent =
        currentEditId
          ? "Update Banner"
          : "Save Banner";

      hideLoading();
    }
  }
);


/* =====================================================
   TOGGLE ACTIVE
===================================================== */

async function toggleBanner(id) {

  const banner =
    banners.find(
      (item) => item.id === id
    );

  if (!banner) return;


  const user =
    getCurrentAdmin() ||
    auth.currentUser;


  if (!user) {

    alert(
      "Please authenticate as an Admin."
    );

    return;
  }


  try {

    showLoading();

    await updateDoc(
      doc(
        db,
        BANNERS_COLLECTION,
        id
      ),
      {
        active:
          banner.active === false,

        updatedAt:
          serverTimestamp(),

        updatedBy:
          user.uid
      }
    );

  } catch (error) {

    console.error(
      "Banner status update failed:",
      error
    );

    alert(
      getReadableFirebaseError(error)
    );

  } finally {

    hideLoading();
  }
}


/* =====================================================
   DELETE
===================================================== */

function openDeleteModal(id) {

  currentDeleteId = id;

  deleteModal.classList.remove(
    "hidden"
  );
}


async function deleteBanner() {

  if (!currentDeleteId) return;


  const banner =
    banners.find(
      (item) =>
        item.id === currentDeleteId
    );


  try {

    showLoading();

    await deleteDoc(
      doc(
        db,
        BANNERS_COLLECTION,
        currentDeleteId
      )
    );


    if (
      banner?.storagePath
    ) {

      await safelyDeleteStorageFile(
        banner.storagePath
      );
    }


    closeDeleteModal();

  } catch (error) {

    console.error(
      "Banner deletion failed:",
      error
    );

    alert(
      getReadableFirebaseError(error)
    );

  } finally {

    hideLoading();
  }
}


/* =====================================================
   EVENT DELEGATION
===================================================== */

bannerList.addEventListener(
  "click",
  (event) => {

    const button =
      event.target.closest(
        "[data-action]"
      );

    if (!button) return;

    const action =
      button.dataset.action;

    const id =
      button.dataset.id;


    if (action === "edit") {

      openEditModal(id);

    } else if (action === "delete") {

      openDeleteModal(id);

    } else if (action === "toggle") {

      toggleBanner(id);
    }
  }
);


/* =====================================================
   MODAL EVENTS
===================================================== */

document
  .getElementById("addBannerButton")
  .addEventListener(
    "click",
    openAddModal
  );


document
  .getElementById("closeModalButton")
  .addEventListener(
    "click",
    closeBannerModal
  );


document
  .getElementById("cancelButton")
  .addEventListener(
    "click",
    closeBannerModal
  );


document
  .getElementById("cancelDeleteButton")
  .addEventListener(
    "click",
    closeDeleteModal
  );


document
  .getElementById("confirmDeleteButton")
  .addEventListener(
    "click",
    deleteBanner
  );


document
  .getElementById("backButton")
  .addEventListener(
    "click",
    () => {

      window.location.href =
        "../";
    }
  );


/* =====================================================
   CLOSE MODALS ON OVERLAY CLICK
===================================================== */

bannerModal.addEventListener(
  "click",
  (event) => {

    if (
      event.target === bannerModal
    ) {

      closeBannerModal();
    }
  }
);


deleteModal.addEventListener(
  "click",
  (event) => {

    if (
      event.target === deleteModal
    ) {

      closeDeleteModal();
    }
  }
);


/* =====================================================
   ESC KEY
===================================================== */

document.addEventListener(
  "keydown",
  (event) => {

    if (event.key !== "Escape") {
      return;
    }

    closeBannerModal();

    closeDeleteModal();
  }
);


/* =====================================================
   MODAL HELPERS
===================================================== */

function closeBannerModal() {

  bannerModal.classList.add(
    "hidden"
  );

  currentEditId = null;

  selectedImageFile = null;

  existingImageUrl = "";

  existingStoragePath = "";

  bannerForm.reset();

  resetImagePreview();

  clearFormError();
}


function closeDeleteModal() {

  deleteModal.classList.add(
    "hidden"
  );

  currentDeleteId = null;
}


function resetImagePreview() {

  imagePreview.removeAttribute(
    "src"
  );

  imagePreviewWrapper.classList.add(
    "hidden"
  );

  uploadPlaceholder.classList.remove(
    "hidden"
  );

  imageInfo.textContent = "";

  bannerImage.value = "";
}


/* =====================================================
   IMAGE UTILITIES
===================================================== */

function getImageDimensions(file) {

  return new Promise(
    (resolve, reject) => {

      const image =
        new Image();

      const url =
        URL.createObjectURL(file);

      image.onload = () => {

        URL.revokeObjectURL(url);

        resolve({
          width: image.naturalWidth,
          height: image.naturalHeight
        });
      };

      image.onerror = () => {

        URL.revokeObjectURL(url);

        reject(
          new Error(
            "Invalid image."
          )
        );
      };

      image.src = url;
    }
  );
}


function getFileExtension(filename) {

  const index =
    filename.lastIndexOf(".");

  if (index === -1) {
    return "";
  }

  return filename
    .slice(index)
    .toLowerCase();
}


function formatBytes(bytes) {

  if (!bytes) {
    return "0 KB";
  }

  const units =
    ["Bytes", "KB", "MB"];

  const index =
    Math.floor(
      Math.log(bytes) /
      Math.log(1024)
    );

  return `${(
    bytes /
    Math.pow(1024, index)
  ).toFixed(1)} ${units[index]}`;
}


/* =====================================================
   STORAGE DELETE
===================================================== */

async function safelyDeleteStorageFile(
  storagePath
) {

  if (!storagePath) {
    return;
  }

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
     * If the file has already been deleted,
     * Firestore deletion should still succeed.
     */
    console.warn(
      "Unable to delete Storage file:",
      error
    );
  }
}


/* =====================================================
   ERROR UI
===================================================== */

function showFormError(message) {

  formError.textContent =
    message;

  formError.classList.remove(
    "hidden"
  );
}


function clearFormError() {

  formError.textContent = "";

  formError.classList.add(
    "hidden"
  );
}


function showErrorState(message) {

  bannerLoading.classList.add(
    "hidden"
  );

  bannerEmpty.classList.remove(
    "hidden"
  );

  bannerEmpty.innerHTML = `
    <div class="empty-title">
      ${escapeHtml(message)}
    </div>
  `;
}


/* =====================================================
   FIREBASE ERROR
===================================================== */

function getReadableFirebaseError(
  error
) {

  if (!error) {
    return "Something went wrong.";
  }

  switch (error.code) {

    case "storage/unauthorized":
      return "You do not have permission to upload this image.";

    case "storage/canceled":
      return "Image upload was cancelled.";

    case "storage/unknown":
      return "An unexpected Storage error occurred.";

    case "permission-denied":
      return "You do not have permission to modify banners.";

    default:
      return error.message ||
        "Something went wrong. Please try again.";
  }
}


/* =====================================================
   TIMESTAMP
===================================================== */

function getTimestampValue(
  timestamp
) {

  if (!timestamp) {
    return 0;
  }

  if (
    typeof timestamp.toMillis ===
    "function"
  ) {

    return timestamp.toMillis();
  }

  if (
    timestamp instanceof Date
  ) {

    return timestamp.getTime();
  }

  if (
    typeof timestamp === "number"
  ) {

    return timestamp;
  }

  return 0;
}


/* =====================================================
   HTML SAFETY
===================================================== */

function escapeHtml(value) {

  return String(value)
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
}


function escapeAttribute(value) {

  return escapeHtml(value);
}
