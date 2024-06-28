import './rowContainer.css';

/**
 * A container that can be passed an array as a prop and will
 * display the elements in the array in a row
 * @param {Object} param0 
 * @param {Array} param0.contents
 */
function RowContainer({contents}){

    return(
        <div className="row-container">
            {contents.join(' ')}
        </div>
    )
}

export default RowContainer