from mongoengine import *
import datetime
from .unit import Unit
from .date_field import ConvertingDateField


class ComparableLease(Document):
    meta = {'collection': 'comparable_leases', 'strict': False}

    # The name of the comparable
    name = StringField()

    # The address of the comparable. This is the full address, including city and region in a single string
    address = StringField()

    # This provides the GPS coordinates of the comparable
    location = PointField()

    # The type of property, as an enumeration.
    propertyType = StringField()

    # The size of the unit in square-feet
    sizeOfUnit = FloatField()

    # The yearly rent for the unit
    yearlyRent = FloatField()

    # The description of the comparable
    description = StringField()

    # The date of the lease
    leaseDate = ConvertingDateField()