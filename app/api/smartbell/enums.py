"""Domain enums (docs/domain-model.md §1 and §7). Stored by name; Spanish labels live in i18n."""

from enum import StrEnum, auto


class _Name(StrEnum):
    """Enum whose value is its own name, so the stored string and the API string are the same."""

    @staticmethod
    def _generate_next_value_(name: str, start: int, count: int, last_values: list[str]) -> str:
        return name


class Role(_Name):
    DUENO = auto()
    ADMINISTRADOR = auto()
    MEDICO = auto()
    NUTRIOLOGO = auto()
    TECNICO_CAMPO = auto()


class NotificationChannel(_Name):
    IN_APP = auto()
    EMAIL = auto()
    WEB_PUSH = auto()
    MOBILE_PUSH = auto()
    SMS = auto()
    WHATSAPP = auto()


class NotificationStatus(_Name):
    PENDING = auto()
    SENT = auto()
    FAILED = auto()


class HerdType(_Name):
    DAIRY = auto()
    BEEF = auto()


class VaccinationPlanStatus(_Name):
    PENDIENTE = auto()
    APROBADO = auto()


class Sex(_Name):
    MACHO = auto()
    HEMBRA = auto()


class AnimalKind(_Name):
    VACA = auto()
    VAQUILLA = auto()
    TORO = auto()
    BECERRO = auto()
    NOVILLO = auto()


class DevelopmentStage(_Name):
    AUTO = auto()
    TERNERA = auto()
    DESTETADA = auto()
    NOVILLA = auto()
    CARGADA = auto()
    VACA_ADULTA = auto()
    VACA_ADULTA_VACIA = auto()
    A_VERIFICAR = auto()
    BECERRO = auto()
    DESTETADO = auto()
    NOVILLO = auto()
    TORO = auto()


class Breed(_Name):
    HOLSTEIN = auto()
    JERSEY = auto()
    SIMMENTAL = auto()
    PARDO_SUIZO = auto()
    GUERNSEY = auto()
    AYRSHIRE = auto()
    SHORTHORN = auto()
    NORMANDO = auto()
    OTRA = auto()


class CrossbreedLevel(_Name):
    FB = auto()
    F4 = auto()
    F3 = auto()
    F2 = auto()
    F1 = auto()


class AnimalStatus(_Name):
    ACTIVE = auto()
    REMOVED = auto()


class RemovalReason(_Name):
    ERROR_REGISTRO = auto()
    VENTA_RASTRO = auto()
    VENTA_OTRO_RANCHO = auto()
    MUERTE = auto()


class ReproState(_Name):
    VAQUILLA = auto()
    RECIEN_PARIDA = auto()
    ABIERTA = auto()
    SERVIDA = auto()
    GESTANTE = auto()
    SECA = auto()


class LactationState(_Name):
    LACTANDO = auto()
    SECA = auto()


class GroupType(_Name):
    PRESET = auto()
    CUSTOM = auto()


class GroupPreset(_Name):
    GENERAL = auto()
    ALTA_PRODUCCION = auto()
    SECAS_RETO = auto()
    RECIEN_PARIDAS = auto()
    ENFERMAS = auto()


class GroupSelection(_Name):
    AUTO = auto()
    MANUAL = auto()


class GroupKpiIndicator(_Name):
    EN_CELO = auto()
    PRENADAS = auto()
    ENFERMAS = auto()
    DIM = auto()


class EventType(_Name):
    ALTA = auto()
    HEAT = auto()
    PREGNANCY_CHECK = auto()
    CALVING = auto()
    ABORTION = auto()
    ILLNESS = auto()
    ACCIDENT = auto()
    MEDICAL_TREATMENT = auto()
    TREATMENT_FOLLOWUP = auto()
    DIET_CHANGE = auto()
    GROUP_CHANGE = auto()
    VACCINATION = auto()
    WEIGHT = auto()
    REMOVAL = auto()


NON_DELETABLE_EVENT_TYPES = frozenset(
    {
        EventType.ALTA,
        EventType.HEAT,
        EventType.PREGNANCY_CHECK,
        EventType.CALVING,
        EventType.ABORTION,
    }
)


class HeatOutcome(_Name):
    NOT_OBSERVED = auto()  # ①
    VWP = auto()  # ②
    NOT_INSEMINATED = auto()  # ③
    DIRTY_MEDICATED = auto()  # ④
    DIRTY_NOT_MEDICATED = auto()  # ⑤
    INSEMINATED = auto()  # ⑦


class ServiceMethod(_Name):
    IA = auto()
    MONTA = auto()


class PregnancyCheckMethod(_Name):
    TACTO = auto()
    ULTRASONIDO = auto()


class PregnancyCheckResult(_Name):
    POSITIVE = auto()
    NEGATIVE = auto()


class CalvingTiming(_Name):
    ESPERADO = auto()
    ANTICIPADO = auto()
    RETRASADO = auto()


class AbortionKind(_Name):
    NATURAL = auto()
    INDUCIDO = auto()


class AbortionCause(_Name):
    HORMONAL = auto()
    REABSORCION = auto()
    NUTRICION = auto()
    DESCONOCIDO = auto()
    ACCIDENTE = auto()
    ENFERMEDAD = auto()
    INTOXICACION_NUTRICIONAL = auto()
    VIRUS = auto()
    BACTERIA = auto()
    TRATAMIENTO = auto()


NATURAL_ABORTION_CAUSES = frozenset(
    {
        AbortionCause.HORMONAL,
        AbortionCause.REABSORCION,
        AbortionCause.NUTRICION,
        AbortionCause.DESCONOCIDO,
    }
)


class Illness(_Name):
    MASTITIS = auto()
    BRUCELOSIS = auto()
    PULMONIA = auto()
    CETOSIS = auto()
    TUBERCULOSIS = auto()
    COJERA = auto()
    FIEBRE_AFTOSA = auto()
    ENVENENAMIENTO = auto()
    OTRO = auto()


class TreatmentType(_Name):
    ANTIBIOTICO = auto()
    ANTISEPTICO = auto()
    ANTIBACTERIANO = auto()
    ANTIMICOTICO = auto()
    QUIRURGICO = auto()
    ANTIINFLAMATORIO = auto()
    CORTICOIDE = auto()
    ANTIMICROBIANO = auto()
    ANTIPARASITARIO = auto()


class CorticoidSubtype(_Name):
    BETAMETASONA = auto()
    DEXAMETASONA = auto()
    CORTISONA = auto()
    PREDNISOLONA = auto()
    HIDROCORTISONA = auto()


class DrugPresentation(_Name):
    TOPICO = auto()
    ORAL = auto()
    INYECCION = auto()


class MedicalTreatmentKind(_Name):
    SINCRONIZACION_CELO = auto()
    HORMONAS_CRECIMIENTO = auto()
    REDUCCION_LECHE = auto()
    VACUNAS = auto()
    OTROS = auto()


class TreatmentFollowupOutcome(_Name):
    SUCCESS = auto()
    CHANGE = auto()


class DietChangeReason(_Name):
    ETAPA_REPRODUCTIVA = auto()
    ENFERMEDAD = auto()
    TRATAMIENTO = auto()
    OTRA = auto()


class DeletionRequestStatus(_Name):
    PENDING = auto()
    APPROVED = auto()
    REJECTED = auto()


class DewormingFrequency(_Name):
    SEIS_MESES = auto()
    ANUAL = auto()


class ColostrumType(_Name):
    MADRE = auto()
    CALIFICADO = auto()


class VaccineStartBy(_Name):
    AGE_MONTHS = auto()
    WEIGHT_KG = auto()
    EVENT = auto()


class VaccineStartEvent(_Name):
    PRIMER_CELO = auto()
    PRIMERA_INSEMINACION = auto()
    DIAGNOSTICO_GESTACION = auto()
    SECADO = auto()


class VaccineFrequency(_Name):
    UNICA = auto()
    REFUERZOS = auto()
    CADA_6_MESES = auto()
    ANUAL = auto()


class AlertKind(_Name):
    HEAT = auto()
    PREGNANCY_CHECK = auto()
    PREG_RECHECK = auto()
    CLOSE_UP = auto()
    CALVING = auto()
    HEALTH = auto()
    VACCINE_DUE = auto()
    TREATMENT_DUE = auto()
    DRY_OFF = auto()
    DIET_CHANGE = auto()


class AlertStatus(_Name):
    PENDING = auto()
    CONFIRMED = auto()
    NEGATED = auto()
    EXPIRED = auto()


class TaskSource(_Name):
    MANUAL = auto()
    AUTOMATIC = auto()
    SYSTEM = auto()
    PROMO = auto()


class TaskKind(_Name):
    MANUAL = auto()
    ONBOARDING_TUTORIAL = auto()
    REGISTER_ANIMALS = auto()
    BUY_PLAN = auto()
    FIRST_EVENT = auto()
    HEAT_OBSERVE = auto()
    INSEMINATE = auto()
    PREG_CONFIRM = auto()
    DRY_OFF = auto()
    CLOSE_UP = auto()
    CALVING_OBSERVE = auto()
    LAST_CALVING_CONFIRM = auto()
    HEALTH_FOLLOWUP = auto()
    DIET_CHANGE = auto()
    MILK_WITHDRAWAL = auto()
    HEIFER_TO_REGISTER = auto()
    VACCINE_DUE = auto()


class TaskFrequency(_Name):
    ONCE = auto()
    DAILY = auto()
    WEEKLY = auto()
    MONTHLY = auto()


class TaskCategory(_Name):
    CAMBIO_POTRERO = auto()
    DIETA = auto()
    REPRODUCCION = auto()
    SALUD = auto()
    OTRA = auto()


class TaskStatus(_Name):
    OPEN = auto()
    DONE = auto()
    DELETED = auto()


class MilkDestination(_Name):
    TANQUE = auto()
    BECERRAS = auto()
    ANTIBIOTICOS = auto()


class HistoryCategory(_Name):
    GANADO = auto()
    USUARIOS = auto()
    DISPOSITIVOS = auto()
    SALUD = auto()
    REPORTES = auto()
    FINANZAS = auto()
    RANCHO = auto()
