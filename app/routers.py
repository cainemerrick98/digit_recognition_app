from fastapi.routing import APIRouter
from fastapi.responses import Response
from pydantic import ValidationError
from app.schemas import HandwrittenDigit
from sklearn.neighbors import KNeighborsClassifier
import numpy as np, joblib as jb, os


router = APIRouter()

with open(os.path.join(os.getcwd(), r'models\knn_digit_classifier.pkl'), mode='rb') as model:
    knn_clf: KNeighborsClassifier = jb.load(model)

@router.post('/predict/')
def predict_digit(digit:HandwrittenDigit):

    if digit.is_empty():
        return {'classification': None}
    
    numpy_digit = np.array(digit.digit)
    numpy_digit = numpy_digit.reshape(1, -1)
    prediction = knn_clf.predict(numpy_digit)

    return {'classification': int(prediction[0])}