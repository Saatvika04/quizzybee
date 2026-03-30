# 🐝 QuizzyBee -- Online Quiz Platform

## 📌 Project Overview

QuizzyBee is a web-based quiz platform that allows users to create,
share, and attempt quizzes. It is built using HTML, CSS, JavaScript, and
Firebase services.

The platform supports both **quiz creators (teachers/mentors)** and
**quiz takers (students)**.

------------------------------------------------------------------------

## 🚀 Features

### 🔐 User Authentication

-   Users can **sign up** and **log in**
-   Authentication handled using Firebase

------------------------------------------------------------------------

### 🧑‍🏫 Create Quiz

-   Users can create custom quizzes by:
    -   Adding questions
    -   Providing options
    -   Selecting correct answers
-   Each quiz is stored in Firebase Firestore
-   A unique **quiz code** is generated for sharing

------------------------------------------------------------------------

### 🎯 Join Quiz

-   Users can enter a **quiz code**
-   The corresponding quiz is fetched from Firebase
-   Questions are displayed dynamically

------------------------------------------------------------------------

### 📝 Attempt Quiz

-   Questions are shown one by one
-   Users select answers
-   Score is calculated at the end

------------------------------------------------------------------------

### 📊 Result Display

-   Final score is shown on the result page
-   Based on user responses

------------------------------------------------------------------------

### 🌐 Deployment

-   Frontend hosted using **GitHub Pages**
-   Firebase used for:
    -   Authentication
    -   Database (Firestore)

------------------------------------------------------------------------

## 🧠 System Flow

User Login → Dashboard → (Create Quiz / Join Quiz)\
↓\
Create Quiz → Save to Firebase → Generate Code\
↓\
Join Quiz → Enter Code → Fetch Questions → Attempt Quiz → View Score

------------------------------------------------------------------------

## 📁 Project Structure

quizzybee/\
│\
├── css/\
│ └── style.css\
│\
├── js/\
│ ├── firebase.js\
│ ├── auth.js\
│ ├── script.js\
│ └── questions.js\
│\
├── index.html\
├── login.html\
├── signup.html\
├── dashboard.html\
├── createQuiz.html\
├── joinQuiz.html\
├── quiz.html\
└── result.html

------------------------------------------------------------------------

## 💡 Technologies Used

-   HTML, CSS, JavaScript\
-   Firebase Authentication\
-   Firebase Firestore\
-   GitHub Pages

------------------------------------------------------------------------

# 🤖 Proposed AI Feature (Bonus Idea)

## 🎯 Idea

An additional feature was planned to allow users to:

1.  Enter a **topic/domain** (e.g., DSA, OS, Aptitude)
2.  Automatically generate quiz questions using **AI**
3.  Attempt the generated quiz instantly

------------------------------------------------------------------------

## ⚙️ Conceptual Workflow

User inputs topic\
↓\
AI API generates questions (JSON format)\
↓\
Questions sent to frontend\
↓\
Displayed in quiz interface

------------------------------------------------------------------------

## 📦 Example AI Output

\[ { "question": "What is the time complexity of binary search?",
"options": \["O(n)", "O(log n)", "O(n log n)"\], "answer": "O(log n)"
}\]

------------------------------------------------------------------------

## 🔐 Implementation Considerations

-   Requires a **backend (Node.js / Firebase Functions)**\
-   API keys must be kept **secure (not exposed in frontend)**\
-   AI response must be parsed into valid JSON

------------------------------------------------------------------------

## 💡 Purpose of AI Feature

-   Generate quizzes dynamically\
-   Reduce need for manual question creation\
-   Enhance user experience\
-   Make the system more intelligent and scalable

------------------------------------------------------------------------

## 📌 Current Status

-   Core quiz system is fully implemented ✅\
-   AI feature was explored as an enhancement 🚀\
-   Not included in final version due to deployment and security
    constraints

------------------------------------------------------------------------

## 🧠 Future Enhancements

-   Leaderboard system 🏆\
-   Timer for quizzes ⏱️\
-   Difficulty levels\
-   Fully integrated AI quiz generation

------------------------------------------------------------------------

## 👩‍💻 Author

Saatvika K\
B.Tech Computer Science Student
