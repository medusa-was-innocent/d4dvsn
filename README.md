# **Cyprien Jaquier's Portfolio**

[![Vue.js](https://img.shields.io/badge/Vue.js-4FC08D?logo=vuedotjs&logoColor=fff)](#)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-%2338B2AC.svg?logo=tailwind-css&logoColor=white)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=fff)](#)

A personal portfolio built with Vue JS and Tailwind CSS. Every component, interaction and animation has been created manually to demonstrate my ability to design and engineer complete front end experiences without relying on pre made libraries.
The site is live at **[https://jaquier.dev](https://jaquier.dev)**.


## **💻 Local Installation**

To run the project locally:

```
npm i
npm run dev
```


## **🌐 Custom Animation Engine**

A key feature of this portfolio is a custom animation engine located in `src/services`.
It synchronises animation updates with browser cycles, centralises event listeners, separates computation from rendering and computes only visible animations through a virtual bounding box system.


### **Animable Component Properties**

When instantiating an animable component within the service, the following properties can be declared.

**`domSection`**
The HTML element that must be visible in order for animations to be active.

**`enableAnimations`**
Defines how animations start. It is typically used to remove pause related CSS states or any manual start logic.

**`disableAnimations`**
Defines how animations stop. It can reapply pause styles or trigger any required cleanup.

**`prepareForAnimations`**
Handles the computation phase of the animation. This method is responsible for gathering data and preparing the state before frames are applied.

**`tick`**
Synchronises and applies the animation frame. This method runs during the animation loop and updates the DOM in a controlled and efficient way.


## **🤖 Deployment and Workflow**

The application is deployed through a CI/CD workflow on GitHub Pages.
Every commit merged into `main` automatically builds and updates the live version.


## **📔 Conventions**

In order to follow best practices and make the project easier to maintain, I followed the conventions below:

* Commit following the [Conventional Commits standard](https://www.conventionalcommits.org/en/v1.0.0/)
* A lightweight [Git Flow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow) structure.
* All code changes go through pull requests. This allows me to review my work cleanly and maintain a structured workflow even as a solo developer.


## **🤝 Feedback and Collaboration**

Anyone is welcome to open an issue to report bugs, suggest enhancements or start a discussion. You can also reach out through any of the contact methods listed in the portfolio.


## **🛡 License**

You are free to use the code in this repository, including the animation library, in your own projects.
If you reuse or redistribute any part of it you must credit me clearly in your project and keep my name attached to the reused work.


## **🙏 Acknowledgements**

Special thanks to [**Drutz**](https://github.com/drutz-cpnv)
for taking the time to provide thoughtful UI and UX feedback.