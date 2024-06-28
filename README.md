# Digit Recognition App

This application allows users to draw handwritten digits on a javascript canvas. A vector representation of these handwritten digits is then sent to a fastAPI backend which is tasked with classifying the image as a digit between 0-9. The api responds with its classification the user is indicated in the bar above the canvas.

# TODO

* Improve image transformation - currently the change from the large canvas to a 28x28 canvas is leading to poor performance
* Clean up React code