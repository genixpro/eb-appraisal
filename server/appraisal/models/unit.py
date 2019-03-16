from mongoengine import *
import datetime


class Tenancy(EmbeddedDocument):
    # The name of the tenant.
    name = StringField()

    # The monthly rent the tenant is paying.
    monthlyRent = FloatField()

    # The yearly rent the tenant is paying.
    yearlyRent = FloatField()

    # The start date of the tenancy.
    startDate = DateTimeField()

    # The end date of the tenancy. If there is a predefined escalation schedule, then there will be separate tenancy objects for each escalation period.
    endDate = DateTimeField()

    def doesOverlapWith(self, otherTenancy):
        # This method returns True if this tenancy objects overlaps with the given
        # tenancy object (time-wise).
        # Otherwise returns False
        if otherTenancy.endDate < self.startDate or otherTenancy.startDate > self.endDate:
            return False
        return True


class Unit(EmbeddedDocument):
    # The number of the unit, as it is used in the building.
    unitNumber = StringField()

    # The floor that the unit is on within the building.
    floorNumber = IntField()

    # This is the size of the unit in square feet.
    squareFootage = IntField()

    # A list of occupants of this unit over various periods of time
    tenancies = ListField(EmbeddedDocumentField(Tenancy))


    def mergeOtherUnitInfo(self, otherUnitInfo):
        if self.unitNumber is None:
            self.unitNumber = otherUnitInfo.unitNumber
        if self.floorNumber is None:
            self.floorNumber = otherUnitInfo.floorNumber
        if self.squareFootage is None:
            self.squareFootage = otherUnitInfo.squareFootage

        for tenancy in otherUnitInfo.tenancies:
            # See if this new tenancy conflicts with any existing tenancies.
            overlapTenancy = None
            for currentTenancy in self.tenancies:
                if currentTenancy.doesOverlapWith(tenancy):
                    overlapTenancy = currentTenancy
                    break
            if overlapTenancy is None:
                self.tenancies.append(tenancy)

