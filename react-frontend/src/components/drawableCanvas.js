import {useRef, useEffect, useState} from 'react';
import './drawableCanvas.css';

/**
 * Implements a canvas that knows how to draw on itself.
 */
function DrawableCanvas({setDigits}){
    const canvasRef = useRef(null)
    const imageDataRef = useRef(null)
    const [dimensions, setDimensions] = useState({width:0, height:0})
    const [drawing, setDrawing] = useState(false)
    const [savedDigits, setSavedDigits] = useState([])
    
    
    /**
     * Sets the canvas dimensions equal to its parents dimensions
     */
    function setCanvasDimensions(){
        if(canvasRef.current){
            const parent = canvasRef.current.parentNode
            if(parent){
                setDimensions({
                    width: parent.clientWidth,
                    height: parent.clientHeight,
                })
            }
        }
    }

    /**
     * stores the current canvas image in the image data ref 
     * variable
     */
    function saveDrawing(){
        if(canvasRef.current){
            imageDataRef.current = canvasRef.current.toDataURL()
        }
    }

    /**
     * Restores the drawing from image data ref onto the rerendered canvas
     * ensures that drawings persist across reredners.
     */
    function restoreDrawing(){
        if(canvasRef.current && imageDataRef.current){
            const ctx = canvasRef.current.getContext('2d')
            const img = new Image()
            img.onload = () => {

                const scaleX = canvasRef.current.width / img.width
                const scaleY = canvasRef.current.height / img.height

                ctx.scale(scaleX, scaleY)
                ctx.drawImage(img, 0, 0)

                ctx.scale(1/scaleX, 1/scaleY)
            }
            img.src = imageDataRef.current
        }
    }

    /**
     * Called each time the component is rendered on the dom.
     * Sets the canvas dimensions equal to its parent.
     * Adds the event listener for window resizes.
     * Defines and returns a clean up function that is called when the 
     * component is removed from the dom, this ensures that multiple identical event 
     * listeners are not the set up.
     */
    useEffect(() => {
        const handleResize = () => {
            saveDrawing()
            setCanvasDimensions()
        }
        handleResize()
        window.addEventListener('resize', handleResize)
        return () => {
            window.removeEventListener('resize', handleResize)
        }
    }, [])

    /**
     * Called each time the component is rendered on the dom.
     * If the canvas ref is references on the canvas element then
     * the canvas height and width is set to the height and width of 
     * the current dimensions
     */
    useEffect(() => {
        if(canvasRef.current){
            canvasRef.current.width = dimensions.width
            canvasRef.current.height = dimensions.height
            restoreDrawing()
        }
    }, [dimensions])
    
    /**
     * 
     * @param {MouseEvent} event 
     */
    function handleClick(event){
        const ctx = event.target.getContext('2d')
        const rect = event.target.getBoundingClientRect()

        ctx.fillStyle = 'black'
        ctx.beginPath()
        ctx.arc(event.clientX - rect.left, event.clientY - rect.top, 1, 0, Math.PI * 2)
        ctx.stroke()

    }

    /**
     * On mouse down get the canvas context and set the drawing indicator to true
     * begin a new path on the context.
     * @param {MouseEvent} event 
     */
    function handleMouseDown(event){
        const ctx = event.target.getContext('2d')
        setDrawing(true)
        ctx.beginPath();
    }

    /**
     * If drawing is true (mouse is down) then draw a line that follows the path 
     * of the mouse. Otherwise do nothing.
     * @param {MouseEvent} event 
     */
    function handleMouseMove(event){
        if(drawing){
            const ctx = event.target.getContext('2d')
            const rect = event.target.getBoundingClientRect()

            ctx.lineWidth = 5
            ctx.lineCap = 'round'
            ctx.strokeStyle = 'black'

            ctx.lineTo(event.clientX - rect.left, event.clientY - rect.top)
            ctx.stroke()
            ctx.moveTo(event.clientX - rect.left, event.clientY - rect.top)
        }
    }

    /**
     * On mouse up set the drawing indicator to false
     * @param {MouseEvent} event 
     */
    function handleMouseUp(event){
        setDrawing(false)
    }

    function clearCanvas(){
        canvasRef.current.getContext('2d').clearRect(0,0,dimensions.width, dimensions.height)

    }

    function recogniseDigit(){

        const request = {
            method:'POST',
            mode:'cors',
            headers:{
                "Content-Type":'application/json'
            },
            body:JSON.stringify({
                digit:getDigit()
            })
        }

        console.log(request)

        fetch('http://127.0.0.1:8000/predict/', request)
        .then((response) => {
            return response.json()
        })
        .then((data) => {
            console.log(data)
            setDigits((prevDigits) => {
                return [...prevDigits, data.classification]
            })
        })
        .catch(error => {
            console.log(error)
        })
    }

    /**
     * finds the bounding box of the digit and crops the image around this box
     * draws the image onto a cropped canvas and then resizes the image to be 
     * 28x28 which is what is expected by the model
     */
    function getDigit(){
        const ctx = canvasRef.current.getContext('2d')
        const imageData = ctx.getImageData(0,0,dimensions.width, dimensions.height).data
        const boundingBox = calculateBoundingBox(imageData)
        const croppedCanvas = document.createElement('canvas')
        const croppedContext = croppedCanvas.getContext('2d')
        croppedCanvas.width = boundingBox.maxX - boundingBox.minX
        croppedCanvas.height = boundingBox.maxY - boundingBox.minY
        croppedContext.drawImage(canvasRef.current, boundingBox.minX, boundingBox.minY, croppedCanvas.width, croppedCanvas.height, 10, 10, croppedCanvas.width-10, croppedCanvas.height-10,)
        const resizedCanvas = document.createElement('canvas')
        const resizedContext = resizedCanvas.getContext('2d')
        resizedCanvas.width = 28
        resizedCanvas.height = 28
        resizedContext.drawImage(croppedCanvas, 0, 0, croppedCanvas.width, croppedCanvas.height, 0, 0, 28, 28)
        setSavedDigits((prevDrawings) => {
            return [...prevDrawings, resizedCanvas]
        })
        var pixelIntensities =  getPixelIntensities(resizedContext.getImageData(0,0,28,28).data)
        pixelIntensities = reshapePixelIntensities(pixelIntensities)
        return pixelIntensities
    }

    /**
     * @param {Uint8ClampedArray} imageData 
     * @returns {Object} 
     */
    function calculateBoundingBox(imageData){
        var minX = dimensions.width
        var maxX = 0
        var minY = dimensions.height
        var maxY = 0

        for(let y=0; y<dimensions.height; y++){
            for(let x=0; x<dimensions.width; x++){
                const index = (y * dimensions.width + x)*4
                if(imageData[index + 3] > 0){
                    minX = Math.min(minX, x)
                    maxX = Math.max(maxX, x)
                    minY = Math.min(minY, y)
                    maxY = Math.max(maxY, y)
                }
            }
        }

        return {minX, maxX, minY, maxY}
    }

    /**
     * @param {Uint8ClampedArray} imageData 
     * @returns {Array} 
     */
    function getPixelIntensities(imageData){
        var pixelIntensities = []
        for(let i=0; i<imageData.length; i+=4){
            pixelIntensities.push(imageData[i+3] / 255) //normalise pixel intensities
        }
        return pixelIntensities
    }

    /**
     * 
     * @param {Array} pixelIntensities 
     */
    function reshapePixelIntensities(pixelIntensities){
        var reshapedPixelIntensities = []
        while(pixelIntensities.length){reshapedPixelIntensities.push(pixelIntensities.splice(0, 28))}
        return reshapedPixelIntensities
    }

    return(
        <div className='drawable-canvas-container'>
            <canvas 
            className='drawable-canvas' 
            ref={canvasRef} 
            onClick={handleClick}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            >  
            </canvas>
            <button className='recognise-button tool' onClick={recogniseDigit}>Recognise</button>
            <button className='clear-button tool' onClick={clearCanvas}>Clear</button>
            <div>
                {savedDigits.map((ele, index) => (
                    <canvas
                    style={{border:'1px solid black'}}
                    key={index}
                    width={28}
                    height={28}
                    ref={ref => {
                    if (ref) {
                        const context = ref.getContext('2d');
                        context.drawImage(ele, 0, 0);
                    }
                    }}
                    />
                ))}
            </div>
        </div>

    );
}

export default DrawableCanvas;