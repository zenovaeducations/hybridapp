import {
  auth,
  db
} from "../../../core/firebase/firebase-config.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  doc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =====================================================
   CONSTANTS
===================================================== */

const COURSES_COLLECTION =
  "zenovaV2Courses";


/* =====================================================
   URL
===================================================== */

const params =
  new URLSearchParams(
    window.location.search
  );

const courseId =
  params.get("id");


/* =====================================================
   STATE
===================================================== */

let currentUser = null;

let course = null;

let subjects = [];

let selectedSubjectId = null;

let chapters = [];


/* =====================================================
   DOM
===================================================== */

const courseTitle =
  document.getElementById(
    "courseTitle"
  );

const courseSubtitle =
  document.getElementById(
    "courseSubtitle"
  );

const courseName =
  document.getElementById(
    "courseName"
  );

const courseDescription =
  document.getElementById(
    "courseDescription"
  );

const courseClass =
  document.getElementById(
    "courseClass"
  );

const courseBoard =
  document.getElementById(
    "courseBoard"
  );

const courseCode =
  document.getElementById(
    "courseCode"
  );

const courseThumbnail =
  document.getElementById(
    "courseThumbnail"
  );

const thumbnailPlaceholder =
  document.getElementById(
    "thumbnailPlaceholder"
  );

const subjectList =
  document.getElementById(
    "subjectList"
  );

const subjectEmpty =
  document.getElementById(
    "subjectEmpty"
  );

const selectedSubjectLabel =
  document.getElementById(
    "selectedSubjectLabel"
  );

const selectedSubjectName =
  document.getElementById(
    "selectedSubjectName"
  );

const selectedSubjectDescription =
  document.getElementById(
    "selectedSubjectDescription"
  );

const chapterList =
  document.getElementById(
    "chapterList"
  );

const chapterEmpty =
  document.getElementById(
    "chapterEmpty"
  );

const addSubjectButton =
  document.getElementById(
    "addSubjectButton"
  );

const addChapterButton =
  document.getElementById(
    "addChapterButton"
  );

const emptyAddSubjectButton =
  document.getElementById(
    "emptyAddSubjectButton"
  );

const emptyAddChapterButton =
  document.getElementById(
    "emptyAddChapterButton"
  );

const backButton =
  document.getElementById(
    "backButton"
  );


/* =====================================================
   MODALS
===================================================== */

const subjectModal =
  document.getElementById(
    "subjectModal"
  );

const chapterModal =
  document.getElementById(
    "chapterModal"
  );

const lessonModal =
  document.getElementById(
    "lessonModal"
  );


/* =====================================================
   FORMS
===================================================== */

const subjectForm =
  document.getElementById(
    "subjectForm"
  );

const chapterForm =
  document.getElementById(
    "chapterForm"
  );

const lessonForm =
  document.getElementById(
    "lessonForm"
  );


/* =====================================================
   INITIALIZE
===================================================== */

if (!courseId) {

  alert(
    "Course ID is missing."
  );

  window.location.href =
    "../";

} else {

  onAuthStateChanged(
    auth,
    async user => {

      if (!user) {

        window.location.href =
          "../../../";

        return;
      }

      currentUser =
        user;

      await loadCourse();

      await loadSubjects();

    }
  );

}


/* =====================================================
   LOAD COURSE
===================================================== */

async function loadCourse() {

  try {

    const courseRef =
      doc(
        db,
        COURSES_COLLECTION,
        courseId
      );

    const snapshot =
      await getDoc(
        courseRef
      );


    if (!snapshot.exists()) {

      alert(
        "Course not found."
      );

      window.location.href =
        "../";

      return;
    }


    course = {
      id: snapshot.id,
      ...snapshot.data()
    };


    renderCourse();

  } catch (error) {

    console.error(
      "Failed to load course:",
      error
    );

    alert(
      "Unable to load course."
    );

  }

}


/* =====================================================
   RENDER COURSE
===================================================== */

function renderCourse() {

  courseTitle.textContent =
    course.name ||
    "Course";

  courseSubtitle.textContent =
    "Manage learning content";


  courseName.textContent =
    course.name ||
    "Untitled Course";


  courseDescription.textContent =
    course.description ||
    "Build subjects, chapters and learning content.";


  courseClass.textContent =
    course.className
      ? `Class ${course.className}`
      : "Class —";


  courseBoard.textContent =
    course.board ||
    "Board —";


  courseCode.textContent =
    course.code ||
    "No course code";


  if (course.thumbnailUrl) {

    courseThumbnail.src =
      course.thumbnailUrl;

    courseThumbnail.style.display =
      "block";

    thumbnailPlaceholder.style.display =
      "none";

  }

}


/* =====================================================
   LOAD SUBJECTS
===================================================== */

async function loadSubjects() {

  try {

    const subjectsRef =
      collection(
        db,
        COURSES_COLLECTION,
        courseId,
        "subjects"
      );

    const snapshot =
      await getDocs(
        subjectsRef
      );


    subjects =
      snapshot.docs
        .map(
          item => ({
            id: item.id,
            ...item.data()
          })
        )
        .sort(
          (a, b) =>
            Number(a.order || 0) -
            Number(b.order || 0)
        );


    renderSubjects();


    if (
      subjects.length &&
      !selectedSubjectId
    ) {

      selectSubject(
        subjects[0].id
      );

    } else {

      renderChapters();

    }

  } catch (error) {

    console.error(
      "Failed to load subjects:",
      error
    );

    showSubjectMessage(
      "Unable to load subjects."
    );

  }

}


/* =====================================================
   RENDER SUBJECTS
===================================================== */

function renderSubjects() {

  subjectList.innerHTML = "";


  if (!subjects.length) {

    subjectEmpty.hidden =
      false;

    return;

  }


  subjectEmpty.hidden =
    true;


  subjects.forEach(
    subject => {

      const card =
        document.createElement(
          "button"
        );

      card.type =
        "button";

      card.className =
        "subject-card";


      if (
        subject.id ===
        selectedSubjectId
      ) {

        card.classList.add(
          "selected"
        );

      }


      card.innerHTML = `

        <div class="subject-name">
          ${escapeHtml(
            subject.name ||
            "Untitled Subject"
          )}
        </div>

        <div class="subject-stats">
          ${Number(
            subject.chapterCount || 0
          )} Chapters
        </div>

      `;


      card.addEventListener(
        "click",
        () => {

          selectSubject(
            subject.id
          );

        }
      );


      subjectList.appendChild(
        card
      );

    }
  );

}


/* =====================================================
   SELECT SUBJECT
===================================================== */

async function selectSubject(
  subjectId
) {

  selectedSubjectId =
    subjectId;


  const subject =
    subjects.find(
      item =>
        item.id ===
        subjectId
    );


  if (!subject) {
    return;
  }


  selectedSubjectLabel.textContent =
    "SUBJECT";


  selectedSubjectName.textContent =
    subject.name ||
    "Subject";


  selectedSubjectDescription.textContent =
    subject.description ||
    "Manage chapters and learning content.";


  addChapterButton.disabled =
    false;


  renderSubjects();

  await loadChapters();

}


/* =====================================================
   LOAD CHAPTERS
===================================================== */

async function loadChapters() {

  if (!selectedSubjectId) {

    chapters = [];

    renderChapters();

    return;

  }


  try {

    const chaptersRef =
      collection(
        db,
        COURSES_COLLECTION,
        courseId,
        "subjects",
        selectedSubjectId,
        "chapters"
      );


    const snapshot =
      await getDocs(
        chaptersRef
      );


    chapters =
      snapshot.docs
        .map(
          item => ({
            id: item.id,
            ...item.data()
          })
        )
        .sort(
          (a, b) =>
            Number(a.order || 0) -
            Number(b.order || 0)
        );


    renderChapters();

  } catch (error) {

    console.error(
      "Failed to load chapters:",
      error
    );

  }

}


/* =====================================================
   RENDER CHAPTERS
===================================================== */

async function renderChapters() {

  chapterList.innerHTML = "";


  if (!selectedSubjectId) {

    chapterEmpty.hidden =
      false;

    return;

  }


  if (!chapters.length) {

    chapterEmpty.hidden =
      false;

    return;

  }


  chapterEmpty.hidden =
    true;


  for (
    const chapter of chapters
  ) {

    const card =
      document.createElement(
        "article"
      );

    card.className =
      "chapter-card";


    const lessonCount =
      await getLessonCount(
        chapter.id
      );


    card.innerHTML = `

      <div class="chapter-header">

        <div class="chapter-left">

          <div class="chapter-number">
            ${escapeHtml(
              chapter.order ||
              "—"
            )}
          </div>

          <div>

            <div class="chapter-title">
              ${escapeHtml(
                chapter.name ||
                "Untitled Chapter"
              )}
            </div>

            ${
              chapter.description
                ? `
                  <div class="chapter-description">
                    ${escapeHtml(
                      chapter.description
                    )}
                  </div>
                `
                : ""
            }

          </div>

        </div>


        <div class="chapter-actions">

          <span class="small-button">
            ${lessonCount}
            ${
              lessonCount === 1
                ? " Lesson"
                : " Lessons"
            }
          </span>

          <button
            type="button"
            class="small-button primary"
            data-add-lesson="${chapter.id}"
          >
            + Add Content
          </button>

          <button
            type="button"
            class="small-button"
            data-delete-chapter="${chapter.id}"
          >
            Delete
          </button>

        </div>

      </div>


      <div
        class="lesson-list"
        id="lessons-${chapter.id}"
      >

        <div class="lesson-row">

          <div class="lesson-main">

            <div class="lesson-icon">
              ⋯
            </div>

            <div>
              <div class="lesson-title">
                Loading content...
              </div>
            </div>

          </div>

        </div>

      </div>

    `;


    chapterList.appendChild(
      card
    );


    const lessonContainer =
      card.querySelector(
        `#lessons-${chapter.id}`
      );


    await renderLessons(
      chapter.id,
      lessonContainer
    );

  }


  bindChapterActions();

}


/* =====================================================
   LESSON COUNT
===================================================== */

async function getLessonCount(
  chapterId
) {

  try {

    const ref =
      collection(
        db,
        COURSES_COLLECTION,
        courseId,
        "subjects",
        selectedSubjectId,
        "chapters",
        chapterId,
        "lessons"
      );


    const snapshot =
      await getDocs(
        ref
      );


    return snapshot.size;

  } catch {

    return 0;

  }

}


/* =====================================================
   RENDER LESSONS
===================================================== */

async function renderLessons(
  chapterId,
  container
) {

  const ref =
    collection(
      db,
      COURSES_COLLECTION,
      courseId,
      "subjects",
      selectedSubjectId,
      "chapters",
      chapterId,
      "lessons"
    );


  const snapshot =
    await getDocs(
      ref
    );


  const lessons =
    snapshot.docs
      .map(
        item => ({
          id: item.id,
          ...item.data()
        })
      )
      .sort(
        (a, b) =>
          Number(a.order || 0) -
          Number(b.order || 0)
      );


  container.innerHTML = "";


  if (!lessons.length) {

    container.innerHTML = `

      <div class="lesson-row">

        <div class="lesson-main">

          <div class="lesson-icon">
            +
          </div>

          <div>

            <div class="lesson-title">
              No learning content yet
            </div>

            <div class="lesson-meta">
              Add a video, PDF or note.
            </div>

          </div>

        </div>

      </div>

    `;

    return;

  }


  lessons.forEach(
    lesson => {

      const row =
        document.createElement(
          "div"
        );

      row.className =
        "lesson-row";


      const icon =
        lesson.type === "pdf"
          ? "📄"
          : lesson.type === "note"
            ? "📝"
            : "🎥";


      row.innerHTML = `

        <div class="lesson-main">

          <div class="lesson-icon">
            ${icon}
          </div>

          <div>

            <div class="lesson-title">
              ${escapeHtml(
                lesson.title ||
                "Untitled Content"
              )}
            </div>

            <div class="lesson-meta">

              ${
                lesson.duration
                  ? escapeHtml(
                      lesson.duration
                    )
                  : ""
              }

              ${
                lesson.free
                  ? " • Free Preview"
                  : ""
              }

            </div>

          </div>

        </div>


        <div class="lesson-actions">

          <button
            type="button"
            class="small-button"
            data-delete-lesson="${lesson.id}"
            data-chapter-id="${chapterId}"
          >
            Delete
          </button>

        </div>

      `;


      container.appendChild(
        row
      );

    }
  );


  container
    .querySelectorAll(
      "[data-delete-lesson]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          async () => {

            const lessonId =
              button.dataset
                .deleteLesson;

            await deleteLesson(
              chapterId,
              lessonId
            );

          }
        );

      }
    );

}


/* =====================================================
   ADD SUBJECT
===================================================== */

addSubjectButton.addEventListener(
  "click",
  openSubjectModal
);

emptyAddSubjectButton.addEventListener(
  "click",
  openSubjectModal
);


function openSubjectModal() {

  subjectForm.reset();

  clearMessage(
    "subjectMessage"
  );

  subjectModal.hidden =
    false;

  document
    .getElementById(
      "subjectName"
    )
    .focus();

}


/* =====================================================
   SAVE SUBJECT
===================================================== */

subjectForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    const name =
      document
        .getElementById(
          "subjectName"
        )
        .value
        .trim();


    const description =
      document
        .getElementById(
          "subjectDescription"
        )
        .value
        .trim();


    if (!name) {
      return;
    }


    try {

      const ref =
        collection(
          db,
          COURSES_COLLECTION,
          courseId,
          "subjects"
        );


      await addDoc(
        ref,
        {

          name,

          description,

          order:
            subjects.length + 1,

          chapterCount:
            0,

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),

          createdBy:
            currentUser.uid

        }
      );


      closeModal(
        subjectModal
      );


      await loadSubjects();


    } catch (error) {

      console.error(
        error
      );

      showSubjectMessage(
        getErrorMessage(
          error
        )
      );

    }

  }
);


/* =====================================================
   ADD CHAPTER
===================================================== */

addChapterButton.addEventListener(
  "click",
  openChapterModal
);

emptyAddChapterButton.addEventListener(
  "click",
  openChapterModal
);


function openChapterModal() {

  if (!selectedSubjectId) {

    alert(
      "Please select a subject first."
    );

    return;

  }


  chapterForm.reset();


  document
    .getElementById(
      "chapterNumber"
    )
    .value =
      chapters.length + 1;


  clearMessage(
    "chapterMessage"
  );


  chapterModal.hidden =
    false;


  document
    .getElementById(
      "chapterName"
    )
    .focus();

}


/* =====================================================
   SAVE CHAPTER
===================================================== */

chapterForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    if (!selectedSubjectId) {
      return;
    }


    const order =
      Number(
        document
          .getElementById(
            "chapterNumber"
          )
          .value
      );


    const name =
      document
        .getElementById(
          "chapterName"
        )
        .value
        .trim();


    const description =
      document
        .getElementById(
          "chapterDescription"
        )
        .value
        .trim();


    if (!name) {
      return;
    }


    try {

      const ref =
        collection(
          db,
          COURSES_COLLECTION,
          courseId,
          "subjects",
          selectedSubjectId,
          "chapters"
        );


      await addDoc(
        ref,
        {

          name,

          description,

          order,

          lessonCount:
            0,

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),

          createdBy:
            currentUser.uid

        }
      );


      await updateDoc(
        doc(
          db,
          COURSES_COLLECTION,
          courseId,
          "subjects",
          selectedSubjectId
        ),
        {
          chapterCount:
            chapters.length + 1,

          updatedAt:
            serverTimestamp()
        }
      );


      closeModal(
        chapterModal
      );


      await loadChapters();


    } catch (error) {

      console.error(
        error
      );

      showChapterMessage(
        getErrorMessage(
          error
        )
      );

    }

  }
);


/* =====================================================
   ADD LESSON
===================================================== */

let activeChapterId =
  null;


function openLessonModal(
  chapterId
) {

  activeChapterId =
    chapterId;


  lessonForm.reset();


  document
    .getElementById(
      "lessonOrder"
    )
    .value = "1";


  document
    .getElementById(
      "lessonModalSubtitle"
    )
    .textContent =
      "Add a video, PDF or note to this chapter.";


  clearMessage(
    "lessonMessage"
  );


  updateLessonTypeFields();


  lessonModal.hidden =
    false;


  document
    .getElementById(
      "lessonTitle"
    )
    .focus();

}


/* =====================================================
   LESSON TYPE
===================================================== */

document
  .getElementById(
    "lessonType"
  )
  .addEventListener(
    "change",
    updateLessonTypeFields
  );


function updateLessonTypeFields() {

  const type =
    document
      .getElementById(
        "lessonType"
      )
      .value;


  const videoGroup =
    document.getElementById(
      "videoUrlGroup"
    );

  const pdfGroup =
    document.getElementById(
      "pdfUrlGroup"
    );


  videoGroup.hidden =
    type !== "video";


  pdfGroup.hidden =
    type !== "pdf";

}


/* =====================================================
   SAVE LESSON
===================================================== */

lessonForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    if (
      !selectedSubjectId ||
      !activeChapterId
    ) {

      return;

    }


    const type =
      document
        .getElementById(
          "lessonType"
        )
        .value;


    const title =
      document
        .getElementById(
          "lessonTitle"
        )
        .value
        .trim();


    const videoUrl =
      document
        .getElementById(
          "videoUrl"
        )
        .value
        .trim();


    const pdfUrl =
      document
        .getElementById(
          "pdfUrl"
        )
        .value
        .trim();


    const description =
      document
        .getElementById(
          "lessonDescription"
        )
        .value
        .trim();


    const duration =
      document
        .getElementById(
          "lessonDuration"
        )
        .value
        .trim();


    const order =
      Number(
        document
          .getElementById(
            "lessonOrder"
          )
          .value
      ) || 1;


    const free =
      document
        .getElementById(
          "lessonFree"
        )
        .checked;


    if (!title) {
      return;
    }


    if (
      type === "video" &&
      !videoUrl
    ) {

      showLessonMessage(
        "Please enter the video URL."
      );

      return;

    }


    if (
      type === "pdf" &&
      !pdfUrl
    ) {

      showLessonMessage(
        "Please enter the PDF URL."
      );

      return;

    }


    try {

      const ref =
        collection(
          db,
          COURSES_COLLECTION,
          courseId,
          "subjects",
          selectedSubjectId,
          "chapters",
          activeChapterId,
          "lessons"
        );


      await addDoc(
        ref,
        {

          type,

          title,

          videoUrl:
            type === "video"
              ? videoUrl
              : "",

          pdfUrl:
            type === "pdf"
              ? pdfUrl
              : "",

          description,

          duration,

          order,

          free,

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),

          createdBy:
            currentUser.uid

        }
      );


      await updateDoc(
        doc(
          db,
          COURSES_COLLECTION,
          courseId,
          "subjects",
          selectedSubjectId,
          "chapters",
          activeChapterId
        ),
        {
          lessonCount:
            (await getLessonCount(
              activeChapterId
            )),

          updatedAt:
            serverTimestamp()
        }
      );


      closeModal(
        lessonModal
      );


      await loadChapters();

    } catch (error) {

      console.error(
        error
      );

      showLessonMessage(
        getErrorMessage(
          error
        )
      );

    }

  }
);


/* =====================================================
   CHAPTER ACTIONS
===================================================== */

function bindChapterActions() {

  document
    .querySelectorAll(
      "[data-add-lesson]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            openLessonModal(
              button.dataset
                .addLesson
            );

          }
        );

      }
    );


  document
    .querySelectorAll(
      "[data-delete-chapter]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          async () => {

            await deleteChapter(
              button.dataset
                .deleteChapter
            );

          }
        );

      }
    );

}


/* =====================================================
   DELETE CHAPTER
===================================================== */

async function deleteChapter(
  chapterId
) {

  const chapter =
    chapters.find(
      item =>
        item.id ===
        chapterId
    );


  if (!chapter) {
    return;
  }


  const confirmed =
    confirm(
      `Delete "${chapter.name}"?\n\nThis should only be done if the chapter has no important content.`
    );


  if (!confirmed) {
    return;
  }


  try {

    await deleteDoc(
      doc(
        db,
        COURSES_COLLECTION,
        courseId,
        "subjects",
        selectedSubjectId,
        "chapters",
        chapterId
      )
    );


    await updateDoc(
      doc(
        db,
        COURSES_COLLECTION,
        courseId,
        "subjects",
        selectedSubjectId
      ),
      {
        chapterCount:
          Math.max(
            0,
            chapters.length - 1
          ),

        updatedAt:
          serverTimestamp()
      }
    );


    await loadChapters();

  } catch (error) {

    console.error(
      error
    );

    alert(
      getErrorMessage(
        error
      )
    );

  }

}


/* =====================================================
   DELETE LESSON
===================================================== */

async function deleteLesson(
  chapterId,
  lessonId
) {

  const confirmed =
    confirm(
      "Delete this learning content?"
    );


  if (!confirmed) {
    return;
  }


  try {

    await deleteDoc(
      doc(
        db,
        COURSES_COLLECTION,
        courseId,
        "subjects",
        selectedSubjectId,
        "chapters",
        chapterId,
        "lessons",
        lessonId
      )
    );


    await updateDoc(
      doc(
        db,
        COURSES_COLLECTION,
        courseId,
        "subjects",
        selectedSubjectId,
        "chapters",
        chapterId
      ),
      {
        lessonCount:
          await getLessonCount(
            chapterId
          ),

        updatedAt:
          serverTimestamp()
      }
    );


    await loadChapters();

  } catch (error) {

    console.error(
      error
    );

    alert(
      getErrorMessage(
        error
      )
    );

  }

}


/* =====================================================
   MODAL EVENTS
===================================================== */

document
  .querySelectorAll(
    "[data-close]"
  )
  .forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          const id =
            button.dataset.close;

          closeModal(
            document.getElementById(
              id
            )
          );

        }
      );

    }
  );


[
  subjectModal,
  chapterModal,
  lessonModal
].forEach(
  modal => {

    modal.addEventListener(
      "click",
      event => {

        if (
          event.target ===
          modal
        ) {

          closeModal(
            modal
          );

        }

      }
    );

  }
);


function closeModal(
  modal
) {

  modal.hidden =
    true;

}


/* =====================================================
   BACK
===================================================== */

backButton.addEventListener(
  "click",
  () => {

    window.location.href =
      "../";

  }
);


/* =====================================================
   MESSAGES
===================================================== */

function showSubjectMessage(
  message
) {

  const element =
    document.getElementById(
      "subjectMessage"
    );

  element.textContent =
    message;

  element.hidden =
    false;

}


function showChapterMessage(
  message
) {

  const element =
    document.getElementById(
      "chapterMessage"
    );

  element.textContent =
    message;

  element.hidden =
    false;

}


function showLessonMessage(
  message
) {

  const element =
    document.getElementById(
      "lessonMessage"
    );

  element.textContent =
    message;

  element.hidden =
    false;

}


function clearMessage(
  id
) {

  const element =
    document.getElementById(
      id
    );

  element.textContent =
    "";

  element.hidden =
    true;

}


/* =====================================================
   HELPERS
===================================================== */

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


function getErrorMessage(
  error
) {

  if (
    error?.code ===
    "permission-denied"
  ) {

    return "Firebase permission denied.";

  }


  return (
    error?.message ||
    "Something went wrong."
  );

}
