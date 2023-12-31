from appraisal.components.document_extractor_dataset import DocumentExtractorDataset
import dateparser
from dateutil.relativedelta import relativedelta
import datetime
import re
import numpy
import copy
import math
from pprint import pprint
from appraisal.models.direct_comparison_valuation import DirectComparisonValuation
from appraisal.components.valuation_model_base import ValuationModelBase

class DirectComparisonValuationModel(ValuationModelBase):
    """ This class encapsulates the code required for producing a stabilized statement"""


    def createDirectComparisonValuation(self, appraisal):
        dca = DirectComparisonValuation()

        dca.marketRentDifferential = 0
        dca.freeRentRentLoss = 0
        dca.vacantUnitRentLoss = 0
        dca.vacantUnitLeasupCosts = 0
        dca.amortizedCapitalInvestment = 0

        if appraisal.directComparisonInputs.directComparisonMetric == 'psf':
            if not appraisal.sizeOfBuilding:
                dca.comparativeValue = 0
                dca.valuation = 0
                dca.valuationRounded = 0
                return dca
            dca.comparativeValue = appraisal.sizeOfBuilding * appraisal.directComparisonInputs.pricePerSquareFoot

        elif appraisal.directComparisonInputs.directComparisonMetric == 'psf_land':
            if not appraisal.sizeOfBuilding:
                dca.comparativeValue = 0
                dca.valuation = 0
                dca.valuationRounded = 0
                return dca
            dca.comparativeValue = (appraisal.sizeOfLand * 43560.0) * appraisal.directComparisonInputs.pricePerSquareFootLand

        elif appraisal.directComparisonInputs.directComparisonMetric == 'per_acre_land':
            if not appraisal.sizeOfLand:
                dca.comparativeValue = 0
                dca.valuation = 0
                dca.valuationRounded = 0
                return dca
            dca.comparativeValue = (appraisal.sizeOfLand) * appraisal.directComparisonInputs.pricePerAcreLand

        elif appraisal.directComparisonInputs.directComparisonMetric == 'psf_buildable_area':
            if not appraisal.buildableArea:
                dca.comparativeValue = 0
                dca.valuation = 0
                dca.valuationRounded = 0
                return dca
            dca.comparativeValue = (appraisal.buildableArea) * appraisal.directComparisonInputs.pricePerSquareFootBuildableArea

        elif appraisal.directComparisonInputs.directComparisonMetric == 'per_buildable_unit':
            if not appraisal.buildableUnits:
                dca.comparativeValue = 0
                dca.valuation = 0
                dca.valuationRounded = 0
                return dca
            dca.comparativeValue = (appraisal.buildableUnits) * appraisal.directComparisonInputs.pricePerBuildableUnit

        elif appraisal.directComparisonInputs.directComparisonMetric == 'noi_multiple':
            if not appraisal.sizeOfBuilding:
                dca.comparativeValue = 0
                dca.valuation = 0
                dca.valuationRounded = 0
                return dca

            noiPSF = (appraisal.stabilizedStatement.netOperatingIncome / appraisal.sizeOfBuilding)

            dca.comparativeValue = noiPSF * appraisal.directComparisonInputs.noiPSFMultiple * appraisal.sizeOfBuilding # Size of building technically cancels out in this equation
        elif appraisal.directComparisonInputs.directComparisonMetric == 'per_unit':
            if not len(appraisal.units):
                dca.comparativeValue = 0
                dca.valuation = 0
                dca.valuationRounded = 0
                return dca

            dca.comparativeValue = len(appraisal.units) * appraisal.directComparisonInputs.pricePerUnit

        else:
            dca.comparativeValue = 0
            dca.valuation = 0
            dca.valuationRounded = 0
            return dca

        dca.marketRentDifferential = self.computeMarketRentDifferentials(appraisal)
        dca.freeRentRentLoss = self.computeFreeRentRentLoss(appraisal)
        dca.vacantUnitRentLoss = self.computeVacantUnitRentLoss(appraisal)
        dca.vacantUnitLeasupCosts = self.computeVacantUnitLeasupCosts(appraisal)
        dca.amortizedCapitalInvestment = self.computeAmortizedCapitalInvestment(appraisal)

        dca.valuation = dca.comparativeValue

        if appraisal.directComparisonInputs.applyMarketRentDifferential:
            dca.valuation += dca.marketRentDifferential

        if appraisal.directComparisonInputs.applyFreeRentLoss:
            dca.valuation += dca.freeRentRentLoss

        if appraisal.directComparisonInputs.applyVacantUnitRentLoss:
            dca.valuation += dca.vacantUnitRentLoss

        if appraisal.directComparisonInputs.applyVacantUnitLeasingCosts:
            dca.valuation += dca.vacantUnitLeasupCosts

        if appraisal.directComparisonInputs.applyAmortization:
            dca.valuation += dca.amortizedCapitalInvestment

        for modifier in appraisal.directComparisonInputs.modifiers:
            if modifier.amount:
                dca.valuation += modifier.amount

        if dca.valuation == 0:
            dca.valuationRounded = 0
        else:
            dca.valuationRounded = round(dca.valuation, -int(math.floor(math.log10(abs(dca.valuation)))) + 2) # Round to 3 significant figures

        return dca


