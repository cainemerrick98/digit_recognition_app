from pydantic import BaseModel, field_validator
from typing import List


class HandwrittenDigit(BaseModel):
    digit: List[List[float]]

    @field_validator('digit')
    def check_digit_shape(cls, digit):
        required_rows = 28
        required_columns = 28

        if len(digit) != required_rows:
            raise ValueError(f'Digit has {len(digit)} rows. Must have 28 rows')
        
        for i, row in enumerate(digit):
            if len(row) != required_columns:
                raise ValueError(f'Row {i} has {len(row)} columns. Must have 28 columns')
        
        return digit
    
    def is_empty(self):
        """
        If all the values in the digit matrix are zero then the digit is empty
        """
        return all(map(lambda x: x==0, [i for j in self.digit for i in j]))
            
