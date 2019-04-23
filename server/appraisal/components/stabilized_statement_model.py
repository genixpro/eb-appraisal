from appraisal.components.document_extractor_dataset import DocumentExtractorDataset
import dateparser
from dateutil.relativedelta import relativedelta
import datetime
import re
import numpy
import copy
import math
from pprint import pprint
from appraisal.models.discounted_cash_flow import MonthlyCashFlowItem, YearlyCashFlowItem, DiscountedCashFlow, DiscountedCashFlowSummary, DiscountedCashFlowSummaryItem
from appraisal.models.stabilized_statement import StabilizedStatement
from appraisal.components.valuation_model_base import ValuationModelBase

class StabilizedStatementModel(ValuationModelBase):
    """ This class encapsulates the code required for producing a stabilized statement"""


    def createStabilizedStatement(self, appraisal):
        statement = StabilizedStatement()

        statement.rentalIncome = self.computeRentalIncome(appraisal)
        statement.additionalIncome = self.computeAdditionalIncome(appraisal)

        if appraisal.stabilizedStatementInputs.expensesMode == 'income_statement':
            statement.managementExpenses = self.computeManagementFees(appraisal)
            statement.operatingExpenses = self.computeTotalOperatingExpenses(appraisal)
            statement.taxes = self.computeTaxes(appraisal)
        elif appraisal.stabilizedStatementInputs.expensesMode == 'tmi':
            if appraisal.sizeOfBuilding and appraisal.stabilizedStatementInputs.tmiRatePSF:
                statement.tmiTotal = appraisal.stabilizedStatementInputs.tmiRatePSF * appraisal.sizeOfBuilding
            else:
                statement.tmiTotal = 0

        statement.marketRentDifferential = self.computeMarketRentDifferentials(appraisal)
        statement.freeRentDifferential = self.computeFreeRentDifferentials(appraisal)
        statement.vacantUnitDifferential = self.computeVacantUnitDifferential(appraisal)
        statement.amortizationDifferential = self.computeAmortizationDifferential(appraisal)
        statement.managementRecovery = self.computeManagementRecoveries(appraisal)
        statement.operatingExpenseRecovery = self.computeOperatingExpenseRecoveries(appraisal)
        statement.recoverableIncome = self.computeTotalRecoverableIncome(appraisal)
        
        statement.potentialGrossIncome = self.computePotentialGrossIncome(appraisal)

        statement.vacancyDeduction = self.computeVacancyDeduction(appraisal)

        statement.effectiveGrossIncome = self.computeEffectiveGrossIncome(appraisal)

        statement.structuralAllowance = statement.potentialGrossIncome * (appraisal.stabilizedStatementInputs.structuralAllowancePercent / 100.0)

        if appraisal.stabilizedStatementInputs.expensesMode == 'income_statement':
            statement.totalExpenses = statement.operatingExpenses + statement.taxes + statement.managementExpenses + statement.structuralAllowance
        elif appraisal.stabilizedStatementInputs.expensesMode == 'tmi' and appraisal.sizeOfBuilding:
            statement.totalExpenses = statement.tmiTotal + statement.structuralAllowance

        statement.netOperatingIncome = statement.effectiveGrossIncome - statement.totalExpenses

        statement.capitalization = statement.netOperatingIncome / (appraisal.stabilizedStatementInputs.capitalizationRate / 100.0)

        statement.valuation = statement.capitalization + statement.marketRentDifferential + statement.freeRentDifferential + statement.vacantUnitDifferential + statement.amortizationDifferential

        for modifier in appraisal.stabilizedStatementInputs.modifiers:
            if modifier.amount:
                statement.valuation += modifier.amount

        if statement.valuation == 0:
            statement.valuationRounded = 0
        else:
            statement.valuationRounded = round(statement.valuation, -int(math.floor(math.log10(abs(statement.valuation)))) + 2) # Round to 3 significant figures

        return statement


    def computeTotalRecoverableIncome(self, appraisal):
        return self.computeManagementRecoveries(appraisal) + self.computeOperatingExpenseRecoveries(appraisal)

    def computePotentialGrossIncome(self, appraisal):
        return self.computeRentalIncome(appraisal) + self.computeAdditionalIncome(appraisal) + self.computeTotalRecoverableIncome(appraisal)

    def computeVacancyDeduction(self, appraisal):
        return self.computePotentialGrossIncome(appraisal) * (appraisal.stabilizedStatementInputs.vacancyRate / 100.0)

    def computeEffectiveGrossIncome(self, appraisal):
        return self.computePotentialGrossIncome(appraisal) - self.computeVacancyDeduction(appraisal)

    def getStabilizedRent(self, appraisal, unit):
        if unit.currentTenancy and unit.currentTenancy.yearlyRent:
            return unit.currentTenancy.yearlyRent
        else:
            rent = self.getMarketRent(appraisal, unit.marketRent) * unit.squareFootage
            if rent:
                return rent
            return 0


    def getRecoveryStructure(self, appraisal, name):
        for recovery in appraisal.recoveryStructures:
            if recovery.name == name:
                return recovery
        return None

    def getDefaultRecoveryStructure(self, appraisal):
        for recovery in appraisal.recoveryStructures:
            if 'default' in recovery.name.lower():
                return recovery
        return appraisal.recoveryStructures[0]



    def computeRentalIncome(self, appraisal):
        total = 0

        for unit in appraisal.units:
            total += self.getStabilizedRent(appraisal, unit)

        return total


    def computeAdditionalIncome(self, appraisal):
        total = 0

        for income in appraisal.incomeStatement.incomes:
            if income.incomeStatementItemType == 'additional_income':
                total += self.getLatestAmount(income)

        return total


    def computeRecoverableOperatingExpenses(self, appraisal):
        total = 0

        for expense in appraisal.incomeStatement.expenses:
            if expense.incomeStatementItemType == 'operating_expense':
                total += self.getLatestAmount(expense)

        return total


    def computeTotalOperatingExpenses(self, appraisal):
        total = 0

        for expense in appraisal.incomeStatement.expenses:
            if expense.incomeStatementItemType == 'operating_expense':
                total += self.getLatestAmount(expense)

        return total


    def computeTaxes(self, appraisal):
        total = 0

        for expense in appraisal.incomeStatement.expenses:
            if expense.incomeStatementItemType == 'taxes':
                total += self.getLatestAmount(expense)

        return total


    def computeManagementFees(self, appraisal):
        total = 0

        if appraisal.stabilizedStatementInputs.managementExpenseMode == 'income_statement':
            for expense in appraisal.incomeStatement.expenses:
                if expense.incomeStatementItemType == 'management_expense':
                    total += self.getLatestAmount(expense)
        elif appraisal.stabilizedStatementInputs.managementExpenseMode == 'rule':
            total = (appraisal.stabilizedStatementInputs.managementExpenseCalculationRule.percentage / 100.0) * self.getCalculationField(appraisal, appraisal.stabilizedStatementInputs.managementExpenseCalculationRule.field)

        return total

    def getCalculationField(self, appraisal, name):
        if name == "operatingExpenses":
            return self.computeTotalOperatingExpenses(appraisal)
        if name == "managementExpenses":
            return self.computeManagementFees(appraisal)
        if name == "taxes":
            return self.computeTaxes(appraisal)
        if name == "rentalIncome":
            return self.computeRentalIncome(appraisal)
        if name == "effectiveGrossIncome":
            return self.computeEffectiveGrossIncome(appraisal)

        for expense in appraisal.incomeStatement.expenses:
            if expense.name == name:
                return expense.getLatestAmount()

    def computeManagementRecoveries(self, appraisal):
        total = 0

        for unit in appraisal.units:
            if unit.currentTenancy and unit.currentTenancy.recoveryStructure and self.getRecoveryStructure(appraisal, unit.currentTenancy.recoveryStructure) is not None:
                recoveryStructure = self.getRecoveryStructure(appraisal, unit.currentTenancy.recoveryStructure)
            else:
                recoveryStructure = self.getDefaultRecoveryStructure(appraisal)

            if recoveryStructure.managementCalculationRule and recoveryStructure.managementCalculationRule.percentage and recoveryStructure.managementCalculationRule.field:
                percentage = (recoveryStructure.managementCalculationRule.percentage / 100.0)

                if recoveryStructure.baseOnUnitSize and unit.squareFootage and appraisal.sizeOfBuilding:
                    percentage *= unit.squareFootage / appraisal.sizeOfBuilding

                total += percentage * self.getCalculationField(appraisal, recoveryStructure.managementCalculationRule.field)

        return total


    def computeOperatingExpenseRecoveries(self, appraisal):
        total = 0
        totalSize = 0

        for unit in appraisal.units:
            if unit.currentTenancy and unit.currentTenancy.recoveryStructure and self.getRecoveryStructure(appraisal, unit.currentTenancy.recoveryStructure) is not None:
                recoveryStructure = self.getRecoveryStructure(appraisal, unit.currentTenancy.recoveryStructure)
            else:
                recoveryStructure = self.getDefaultRecoveryStructure(appraisal)

            totalSize += unit.squareFootage

            for rule in recoveryStructure.expenseCalculationRules:
                if rule.percentage and rule.field:
                    percentage = (rule.percentage / 100.0)

                    if recoveryStructure.baseOnUnitSize and unit.squareFootage and appraisal.sizeOfBuilding:
                        percentage *= unit.squareFootage / appraisal.sizeOfBuilding

                    total += percentage * self.getCalculationField(appraisal, rule.field)

        return total
