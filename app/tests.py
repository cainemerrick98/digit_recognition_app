import unittest, json
from fastapi.testclient import TestClient
from main import app
from schemas import HandwrittenDigit
from pydantic import ValidationError
import numpy as np

class TestDigitSchema(unittest.TestCase):
    """
    Test cases to ensure the handwritten digit pydantic model behaves as 
    expected.
    """
    
    def setUp(self) -> None:
        return super().setUp()
    
    def test_invalid_digit(self):
        """
        Unless the digit parameter is an array of shape (28,28) then the HandwrittenDigit model 
        should raise a validation error
        """
        self.assertRaises(ValidationError, HandwrittenDigit, digit=2)
        self.assertRaises(ValidationError, HandwrittenDigit, digit=[2])
        self.assertRaises(ValidationError, HandwrittenDigit, digit=[2, 2])
        self.assertRaises(ValidationError, HandwrittenDigit, digit=[[2, 2],[2,2]])
    
    def test_digit_is_empty(self):
        """
        Tests the `is_empty` method of the HandwrittenDigit model.
        """
        empty_digit = HandwrittenDigit(digit=[[0 for _ in range(28)] for _ in range(28)])
        self.assertTrue(empty_digit.is_empty())
        non_empty_digit = HandwrittenDigit(digit=[[1 for _ in range(28)] for _ in range(28)])
        self.assertFalse(non_empty_digit.is_empty())

    

class TestApi(unittest.TestCase):

    def setUp(self) -> None:
        self.app = TestClient(app)
        self.empty_digit = [[0 for _ in range(28)] for _ in range(28)]
        self.non_empty_digit = np.random.rand(28, 28).tolist()

        return super().setUp()
    
    def test_root(self):
        """
        The api root should return a welcome message
        """
        response = self.app.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['msg'], 'Welcome to the Digit Recognition App')

    def test_predict_incorrect_schema(self):
        """
        If the prediction request schema is incorrect we expect an unprocessable entity error code of 422
        """
        data = json.dumps({'digit':[2]})
        response = self.app.post('/predict/', content=data)
        self.assertEqual(response.status_code, 422)

    def test_predict_correct_schema(self):
        """
        If the prediction request is sent in the correct format we expect a status code of 200
        The json body of the response should contain a classification its value should be between 0-9
        """
        data = json.dumps({'digit':self.empty_digit})
        response = self.app.post('/predict/', content=data)
        self.assertEqual(response.status_code, 200)
    
    def test_predict_empty_digit(self):
        """
        If the prediction request contains an empty digit i.e. all cells == 0. The response should indicate 
        this by setting the classification in the body to None
        """
        data = json.dumps({'digit':self.empty_digit})
        response = self.app.post('/predict/', content=data)
        self.assertEqual(response.json()['classification'], None)

    def test_predict_non_empty_digit(self):
        """
        If the prediction request contains an non_empty digit i.e. all(cells != 0). The response will contain a classification
        betweeen 0-9
        """
        classifications = [i for i in range(10)]
        data = json.dumps({'digit':self.non_empty_digit})
        response = self.app.post('/predict/', content=data)
        self.assertIn(response.json()['classification'], classifications)


    


    