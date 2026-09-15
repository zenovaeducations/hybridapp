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
   COLLECTIONS
===================================================== */

const COURSES_COLLECTION =
  "zenovaV2Courses";

const STORAGE_FOLDER =
  "zenovaV2Courses";


/* =====================================================
   STATE
===================================================== */

let currentUser = null;

let courses = [];

let editingCourseId = null;

let editingCourseData = null;

let selectedThumbnailFile = null;

let thumbnailSource = "upload";

let unsubscribeCourses = null;

let subjects = [];


/* =====================================================
   DOM
===================================================== */

const courseListView =
  document.getElementById(
    "courseListView"
  );

const courseFormView =
  document.getElementById(
    "courseFormView"
  );

const courseList =
  document.getElementById(
    "courseList"
  );

const emptyState =
  document.getElementById(
    "emptyState"
  );

const courseCount =
  document.getElementById(
    "courseCount"
  );

const courseForm =
  document.getElementById(
    "courseForm"
  );

const formTitle =
  document.getElementById(
    "formTitle"
  );

const courseName =
  document.getElementById(
    "courseName"
  );

const courseCode =
  document.getElementById(
    "courseCode"
  );

const courseClass =
  document.getElementById(
    "courseClass"
  );

const courseBoard =
  document.getElementById(
    "courseBoard"
  );

const courseDescription =
  document.getElementById(
    "courseDescription"
  );

const coursePriority =
  document.getElementById(
    "coursePriority"
  );

const thumbnailFile =
  document.getElementById(
    "thumbnailFile"
  );

const thumbnailUrl =
  document.getElementById(
    "thumbnailUrl"
  );

const thumbnailUploadPanel =
  document.getElementById(
    "thumbnailUploadPanel"
  );

const thumbnailUrlPanel =
  document.getElementById(
    "thumbnailUrlPanel"
  );

const thumbnailPreviewContainer =
  document.getElementById(
    "thumbnailPreviewContainer"
  );

const thumbnailPreview =
  document.getElementById(
    "thumbnailPreview"
  );

const thumbnailDimensions =
  document.getElementById(
    "thumbnailDimensions"
  );

const firstLanguage =
  document.getElementById(
    "firstLanguage"
  );

const secondLanguage =
  document.getElementById(
    "secondLanguage"
  );

const thirdLanguage =
  document.getElementById(
    "thirdLanguage"
  );

const newSubject =
  document.getElementById(
    "newSubject"
  );

const subjectList =
  document.getElementById(
    "subjectList"
  );

const courseActive =
  document.getElementById(
    "courseActive"
  );

const formMessage =
  document.getElementById(
    "formMessage"
  );

const saveCourseButton =
  document.getElementById(
    "saveCourseButton"
  );


/* =====================================================
   INITIALIZE
===================================================== */

createLoadingScreen();

showLoading();


/* =====================================================
   AUTH
===================================================== */

onAuthStateChanged(
  auth,
  user => {

    currentUser = user || null;

    /*
     * Admin authentication is intentionally
     * not enforced yet.
     *
     * Later the centralized admin.js
     * authorization layer will be used here.
     */

    startCourseListener();

    hideLoading();
  }
);


/* =====================================================
   COURSE LISTENER
===================================================== */

function startCourseListener() {

  if (unsubscribeCourses) {
    unsubscribeCourses();
  }

  const coursesRef =
    collection(
      db,
      COURSES_COLLECTION
    );

  const coursesQuery =
    query(
      coursesRef,
      orderBy(
        "priority",
        "asc"
      )
    );

  unsubscribeCourses =
    onSnapshot(
      coursesQuery,

      snapshot => {

        courses =
          snapshot.docs.map(
            item => ({
              id: item.id,
              ...item.data()
            })
          );

        renderCourses();
      },

      error => {

        console.error(
          "Course listener error:",
          error
        );

        courseList.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">!</div>

            <h3>
              Unable to load courses
            </h3>

            <p>
              ${escapeHtml(
                error.message ||
                "Please try again."
              )}
            </p>
          </div>
        `;
      }
    );
}


/* =====================================================
   RENDER COURSES
===================================================== */

function renderCourses() {

  courseList.innerHTML = "";

  courseCount.textContent =
    `${courses.length} ${
      courses.length === 1
        ? "Course"
        : "Courses"
    }`;


  if (!courses.length) {

    emptyState.hidden = false;

    return;
  }


  emptyState.hidden = true;


  courses.forEach(
    course => {

      const card =
        document.createElement(
          "article"
        );

      card.className =
        "course-card";


      const languages =
        getLanguages(course);


      const subjects =
        Array.isArray(
          course.subjects
        )
          ? course.subjects
          : [];


      card.innerHTML = `

        <div class="course-thumbnail">

          ${
            course.thumbnailUrl
              ? `
                <img
                  src="${escapeAttribute(
                    course.thumbnailUrl
                  )}"
                  alt="${escapeAttribute(
                    course.name || "Course"
                  )}"
                  loading="lazy"
                >
              `
              : `
                <div
                  class="course-thumbnail-placeholder"
                >
                  No thumbnail
                </div>
              `
          }

        </div>


        <div class="course-body">

          <div class="course-name">
            ${escapeHtml(
              course.name ||
              "Untitled Course"
            )}
          </div>


          ${
            course.code
              ? `
                <div class="course-code">
                  ${escapeHtml(
                    course.code
                  )}
                </div>
              `
              : ""
          }


          ${
            course.description
              ? `
                <div class="course-description">
                  ${escapeHtml(
                    course.description
                  )}
                </div>
              `
              : ""
          }


          <div class="course-meta">

            ${
              course.className
                ? `
                  <span class="meta">
                    Class ${escapeHtml(
                      course.className
                    )}
                  </span>
                `
                : ""
            }


            ${
              course.board
                ? `
                  <span class="meta">
                    ${escapeHtml(
                      course.board
                    )}
                  </span>
                `
                : ""
            }


            <span
              class="
                meta
                ${
                  course.active === false
                    ? "inactive"
                    : "active"
                }
              "
            >
              ${
                course.active === false
                  ? "Inactive"
                  : "Active"
              }
            </span>

          </div>


          ${
            languages.length
              ? `
                <div class="course-languages">
                  ${escapeHtml(
                    languages.join(" • ")
                  )}
                </div>
              `
              : ""
          }


          ${
            subjects.length
              ? `
                <div class="course-languages">
                  ${subjects.length}
                  ${
                    subjects.length === 1
                      ? "Subject"
                      : "Subjects"
                  }
                </div>
              `
              : ""
          }


          <div class="course-actions">

            <button
              type="button"
              class="course-action"
              data-action="edit"
              data-id="${course.id}"
            >
              Edit
            </button>


            <button
              type="button"
              class="course-action manage"
              data-action="manage"
              data-id="${course.id}"
            >
              Manage
            </button>


            <button
              type="button"
              class="course-action"
              data-action="delete"
              data-id="${course.id}"
            >
              Delete
            </button>

          </div>

        </div>
      `;


      courseList.appendChild(card);
    }
  );
}


/* =====================================================
   FORM
===================================================== */

function openCreateForm() {

  editingCourseId = null;

  editingCourseData = null;

  formTitle.textContent =
    "Create Course";

  saveCourseButton.textContent =
    "Create Course";

  resetForm();

  courseListView.hidden = true;

  courseFormView.hidden = false;
}


function openEditForm(course) {

  editingCourseId =
    course.id;

  editingCourseData =
    { ...course };


  formTitle.textContent =
    "Edit Course";

  saveCourseButton.textContent =
    "Save Changes";


  courseName.value =
    course.name || "";

  courseCode.value =
    course.code || "";

  courseClass.value =
    course.className || "";

  courseBoard.value =
    course.board || "";

  courseDescription.value =
    course.description || "";

  coursePriority.value =
    Number(
      course.priority ?? 0
    );


  const languages =
    getLanguages(course);

  firstLanguage.value =
    languages[0] || "";

  secondLanguage.value =
    languages[1] || "";

  thirdLanguage.value =
    languages[2] || "";


  subjects =
    Array.isArray(
      course.subjects
    )
      ? [...course.subjects]
      : [];


  renderSubjects();


  courseActive.checked =
    course.active !== false;


  selectedThumbnailFile =
    null;


  if (course.thumbnailUrl) {

    showThumbnailPreview(
      course.thumbnailUrl
    );

  } else {

    hideThumbnailPreview();
  }


  if (
    course.thumbnailSource ===
    "URL"
  ) {

    setThumbnailSource(
      "url"
    );

    thumbnailUrl.value =
      course.thumbnailUrl || "";

  } else {

    setThumbnailSource(
      "upload"
    );

    thumbnailUrl.value = "";
  }


  clearMessage();


  courseListView.hidden = true;

  courseFormView.hidden = false;
}


function closeForm() {

  courseFormView.hidden = true;

  courseListView.hidden = false;

  editingCourseId = null;

  editingCourseData = null;

  resetForm();
}


function resetForm() {

  courseForm.reset();

  coursePriority.value =
    "0";

  courseActive.checked =
    true;

  subjects = [];

  selectedThumbnailFile =
    null;

  setThumbnailSource(
    "upload"
  );

  hideThumbnailPreview();

  clearMessage();
}


/* =====================================================
   THUMBNAIL SOURCE
===================================================== */

function setThumbnailSource(
  source
) {

  thumbnailSource =
    source;


  document
    .querySelectorAll(
      ".source-tab"
    )
    .forEach(
      tab => {

        tab.classList.toggle(
          "active",
          tab.dataset.source ===
          source
        );
      }
    );


  thumbnailUploadPanel.hidden =
    source !== "upload";

  thumbnailUrlPanel.hidden =
    source !== "url";
}


document
  .querySelectorAll(
    ".source-tab"
  )
  .forEach(
    tab => {

      tab.addEventListener(
        "click",
        () => {

          setThumbnailSource(
            tab.dataset.source
          );
        }
      );
    }
  );


/* =====================================================
   THUMBNAIL FILE
===================================================== */

thumbnailFile.addEventListener(
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


    if (
      !validTypes.includes(
        file.type
      )
    ) {

      showMessage(
        "Please select a JPG, PNG or WEBP image.",
        "error"
      );

      thumbnailFile.value = "";

      return;
    }


    selectedThumbnailFile =
      file;


    const localUrl =
      URL.createObjectURL(
        file
      );


    showThumbnailPreview(
      localUrl
    );
  }
);


/* =====================================================
   THUMBNAIL URL
===================================================== */

thumbnailUrl.addEventListener(
  "input",
  () => {

    const url =
      thumbnailUrl.value.trim();

    if (!url) {

      hideThumbnailPreview();

      return;
    }

    showThumbnailPreview(
      url
    );
  }
);


function showThumbnailPreview(
  url
) {

  thumbnailPreview.src =
    url;

  thumbnailPreviewContainer.hidden =
    false;


  thumbnailPreview.onload =
    () => {

      thumbnailDimensions.textContent =
        `${thumbnailPreview.naturalWidth} × ${thumbnailPreview.naturalHeight}px`;
    };


  thumbnailPreview.onerror =
    () => {

      thumbnailDimensions.textContent =
        "Unable to load image.";
    };
}


function hideThumbnailPreview() {

  thumbnailPreviewContainer.hidden =
    true;

  thumbnailPreview.src = "";

  thumbnailDimensions.textContent =
    "";
}


/* =====================================================
   SUBJECTS
===================================================== */

document
  .getElementById(
    "addSubjectButton"
  )
  .addEventListener(
    "click",
    addSubject
  );


newSubject.addEventListener(
  "keydown",
  event => {

    if (
      event.key ===
      "Enter"
    ) {

      event.preventDefault();

      addSubject();
    }
  }
);


function addSubject() {

  const name =
    newSubject.value.trim();


  if (!name) {

    return;
  }


  const exists =
    subjects.some(
      subject =>
        normalize(
          getSubjectName(
            subject
          )
        ) === normalize(name)
    );


  if (exists) {

    showMessage(
      "This subject has already been added.",
      "error"
    );

    return;
  }


  subjects.push({
    name
  });


  newSubject.value = "";

  renderSubjects();

  clearMessage();
}


function renderSubjects() {

  subjectList.innerHTML = "";


  subjects.forEach(
    (subject, index) => {

      const name =
        getSubjectName(
          subject
        );


      const chip =
        document.createElement(
          "div"
        );

      chip.className =
        "subject-chip";


      chip.innerHTML = `

        <span>
          ${escapeHtml(name)}
        </span>

        <button
          type="button"
          class="subject-remove"
          data-index="${index}"
          aria-label="Remove subject"
        >
          ×
        </button>

      `;


      subjectList.appendChild(
        chip
      );
    }
  );
}


subjectList.addEventListener(
  "click",
  event => {

    const button =
      event.target.closest(
        ".subject-remove"
      );

    if (!button) return;


    const index =
      Number(
        button.dataset.index
      );


    subjects.splice(
      index,
      1
    );


    renderSubjects();
  }
);


/* =====================================================
   SAVE COURSE
===================================================== */

courseForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();

    clearMessage();


    const name =
      courseName.value.trim();

    const code =
      courseCode.value.trim();

    const className =
      courseClass.value;

    const board =
      courseBoard.value.trim();

    const description =
      courseDescription.value.trim();

    const priority =
      Number(
        coursePriority.value
      ) || 0;


    const languages =
      cleanLanguages([
        firstLanguage.value,
        secondLanguage.value,
        thirdLanguage.value
      ]);


    if (!name) {

      showMessage(
        "Course name is required.",
        "error"
      );

      return;
    }


    if (!className) {

      showMessage(
        "Please select a class.",
        "error"
      );

      return;
    }


    /*
     * Subject structure is stored as an array
     * on the course for now.
     *
     * When we build the Course Management page,
     * individual subject documents will also be
     * created in zenovaV2Subjects.
     */


    try {

      saveCourseButton.disabled =
        true;

      saveCourseButton.textContent =
        editingCourseId
          ? "Saving..."
          : "Creating...";


      let thumbnailUrlValue =
        editingCourseData?.thumbnailUrl ||
        "";

      let thumbnailStoragePath =
        editingCourseData?.thumbnailStoragePath ||
        "";

      let thumbnailSourceValue =
        editingCourseData?.thumbnailSource ||
        "";


      /* -----------------------------------------------
         UPLOAD THUMBNAIL
      ------------------------------------------------ */

      if (
        thumbnailSource ===
        "upload" &&
        selectedThumbnailFile
      ) {

        const extension =
          getExtension(
            selectedThumbnailFile.name
          );


        const filename =
          `${Date.now()}_${crypto.randomUUID()}.${extension}`;


        thumbnailStoragePath =
          `${STORAGE_FOLDER}/${filename}`;


        const storageRef =
          ref(
            storage,
            thumbnailStoragePath
          );


        await uploadBytes(
          storageRef,
          selectedThumbnailFile,
          {
            contentType:
              selectedThumbnailFile.type
          }
        );


        thumbnailUrlValue =
          await getDownloadURL(
            storageRef
          );


        thumbnailSourceValue =
          "UPLOAD";
      }


      /* -----------------------------------------------
         URL THUMBNAIL
      ------------------------------------------------ */

      if (
        thumbnailSource ===
        "url" &&
        thumbnailUrl.value.trim()
      ) {

        thumbnailUrlValue =
          thumbnailUrl.value.trim();

        thumbnailSourceValue =
          "URL";


        if (
          editingCourseData?.thumbnailStoragePath
        ) {

          await safelyDeleteStorageFile(
            editingCourseData.thumbnailStoragePath
          );

          thumbnailStoragePath =
            "";
        }
      }


      /* -----------------------------------------------
         COURSE DATA
      ------------------------------------------------ */

      const courseData = {

        name,

        code,

        className,

        board,

        description,

        thumbnailUrl:
          thumbnailUrlValue,

        thumbnailSource:
          thumbnailSourceValue,

        thumbnailStoragePath,

        languages,

        /*
         * Convenient named fields.
         * This makes the data easy to read later.
         */
        firstLanguage:
          languages[0] || "",

        secondLanguage:
          languages[1] || "",

        thirdLanguage:
          languages[2] || "",

        subjects:

          subjects.map(
            (subject, index) => ({
              name:
                getSubjectName(
                  subject
                ),

              order:
                Number(
                  subject.order ??
                  index + 1
                )
            })
          ),

        priority,

        active:
          courseActive.checked,

        updatedAt:
          serverTimestamp(),

        updatedBy:
          currentUser?.uid ||
          null
      };


      /* -----------------------------------------------
         UPDATE
      ------------------------------------------------ */

      if (editingCourseId) {

        await updateDoc(
          doc(
            db,
            COURSES_COLLECTION,
            editingCourseId
          ),
          courseData
        );


        /*
         * If a new uploaded thumbnail replaced
         * the previous uploaded thumbnail,
         * remove the old Storage file.
         */

        if (
          editingCourseData?.thumbnailStoragePath &&
          thumbnailSource === "upload" &&
          selectedThumbnailFile
        ) {

          await safelyDeleteStorageFile(
            editingCourseData.thumbnailStoragePath
          );
        }


      }


      /* -----------------------------------------------
         CREATE
      ------------------------------------------------ */

      else {

        await addDoc(
          collection(
            db,
            COURSES_COLLECTION
          ),
          {
            ...courseData,

            createdAt:
              serverTimestamp(),

            createdBy:
              currentUser?.uid ||
              null
          }
        );
      }


      closeForm();


    } catch (error) {

      console.error(
        "Course save error:",
        error
      );


      showMessage(
        getFirebaseErrorMessage(
          error
        ),
        "error"
      );


    } finally {

      saveCourseButton.disabled =
        false;

      saveCourseButton.textContent =
        editingCourseId
          ? "Save Changes"
          : "Create Course";
    }
  }
);


/* =====================================================
   COURSE ACTIONS
===================================================== */

courseList.addEventListener(
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


    const course =
      courses.find(
        item =>
          item.id === id
      );


    if (!course) return;


    if (
      action === "edit"
    ) {

      openEditForm(
        course
      );

      return;
    }


    if (
      action === "manage"
    ) {

      /*
       * This page will be created next.
       *
       * It will manage:
       * Subjects
       * Chapters
       * Videos
       * Notes
       * PDFs
       */

      window.location.href =
        `./course/?id=${encodeURIComponent(id)}`;

      return;
    }


    if (
      action === "delete"
    ) {

      deleteCourse(
        course
      );
    }
  }
);


/* =====================================================
   DELETE COURSE
===================================================== */

async function deleteCourse(
  course
) {

  const confirmed =
    window.confirm(
      `Delete "${course.name || "this course"}"?\n\nThis will remove the course record.`
    );


  if (!confirmed) return;


  try {

    showLoading();


    await deleteDoc(
      doc(
        db,
        COURSES_COLLECTION,
        course.id
      )
    );


    if (
      course.thumbnailStoragePath
    ) {

      await safelyDeleteStorageFile(
        course.thumbnailStoragePath
      );
    }


  } catch (error) {

    console.error(
      "Delete course error:",
      error
    );


    alert(
      getFirebaseErrorMessage(
        error
      )
    );


  } finally {

    hideLoading();
  }
}


/* =====================================================
   NAVIGATION
===================================================== */

document
  .getElementById(
    "addCourseButton"
  )
  .addEventListener(
    "click",
    openCreateForm
  );


document
  .getElementById(
    "emptyCreateButton"
  )
  .addEventListener(
    "click",
    openCreateForm
  );


document
  .getElementById(
    "closeFormButton"
  )
  .addEventListener(
    "click",
    closeForm
  );


document
  .getElementById(
    "cancelButton"
  )
  .addEventListener(
    "click",
    closeForm
  );


document
  .getElementById(
    "backButton"
  )
  .addEventListener(
    "click",
    () => {

      if (
        !courseFormView.hidden
      ) {

        closeForm();

      } else {

        window.location.href =
          "../";
      }
    }
  );


/* =====================================================
   HELPERS
===================================================== */

function getLanguages(
  course
) {

  if (
    Array.isArray(
      course.languages
    )
  ) {

    return cleanLanguages(
      course.languages
    );
  }


  return cleanLanguages([
    course.firstLanguage,
    course.secondLanguage,
    course.thirdLanguage
  ]);
}


function cleanLanguages(
  values
) {

  const result = [];

  values.forEach(
    value => {

      const language =
        String(
          value || ""
        ).trim();


      if (!language) return;


      const exists =
        result.some(
          item =>
            normalize(item) ===
            normalize(language)
        );


      if (!exists) {
        result.push(language);
      }
    }
  );


  return result.slice(
    0,
    3
  );
}


function getSubjectName(
  subject
) {

  if (
    typeof subject ===
    "string"
  ) {

    return subject.trim();
  }


  return String(
    subject?.name ||
    subject?.subjectName ||
    ""
  ).trim();
}


function normalize(
  value
) {

  return String(
    value || ""
  )
    .trim()
    .toLowerCase()
    .replace(
      /\s+/g,
      " "
    );
}


function getExtension(
  filename
) {

  const parts =
    filename.split(".");

  return parts.length > 1
    ? parts
        .pop()
        .toLowerCase()
    : "jpg";
}


async function safelyDeleteStorageFile(
  path
) {

  if (!path) return;


  try {

    await deleteObject(
      ref(
        storage,
        path
      )
    );

  } catch (error) {

    console.warn(
      "Could not delete Storage file:",
      error
    );
  }
}


function showMessage(
  text,
  type = "error"
) {

  formMessage.textContent =
    text;

  formMessage.className =
    `form-message ${type}`;

  formMessage.hidden =
    false;
}


function clearMessage() {

  formMessage.textContent =
    "";

  formMessage.className =
    "form-message";

  formMessage.hidden =
    true;
}


function escapeHtml(
  value
) {

  return String(
    value ?? ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
}


function escapeAttribute(
  value
) {

  return escapeHtml(
    value
  );
}


function getFirebaseErrorMessage(
  error
) {

  if (!error) {
    return "Something went wrong.";
  }


  if (
    error.code ===
    "permission-denied"
  ) {

    return "Firebase permission denied.";
  }


  if (
    error.code ===
    "storage/unauthorized"
  ) {

    return "Firebase Storage permission denied.";
  }


  return (
    error.message ||
    "Unable to complete the operation."
  );
}
