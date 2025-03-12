from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel, Field, validator
from typing import List, Optional
from sqlalchemy import (
    create_engine, Column, Integer, String, Numeric, Date, Boolean, TIMESTAMP, func, JSON
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
import datetime
from fastapi.middleware.cors import CORSMiddleware
from dateutil.relativedelta import relativedelta

# Database connection (adjust credentials if necessary)
DATABASE_URL = "postgresql://myuser:mypassword@localhost:5432/mydb"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ------------------------
# Database Models
# ------------------------

class MonthlyUpload(Base):
    __tablename__ = "monthly_uploads"
    upload_id = Column(Integer, primary_key=True, autoincrement=True)
    upload_type = Column(String(50), nullable=False)  # e.g., 'CRM', 'ERP_Sales', 'DataCode'
    file_name = Column(String(255))
    upload_timestamp = Column(TIMESTAMP, default=func.now())

class CRMProjectRaw(Base):
    __tablename__ = "crm_projects_raw"
    id = Column(Integer, primary_key=True, autoincrement=True)
    upload_id = Column(Integer)  # Ideally a ForeignKey to monthly_uploads.upload_id
    project_id = Column(Integer)  # Mapped from "No"
    status = Column(String(255))         # "status"
    phase = Column(String(255))          # "Phase"
    company_name = Column(String(255))  # "Company Name"
    department = Column(String(255))    # "Department Name"
    project_name = Column(String)       # "Project name"
    project_manager = Column(String(255))  # "Project Manager"
    pm = Column(String(255))               # "PM"
    order_amount_gross = Column(Numeric, nullable=True)  # "Order amount (gross)"
    order_amount_net = Column(Numeric, nullable=True)    # "Order amount (net)"
    unit = Column(String(255), nullable=True)             # "unit"
    contract_start_date = Column(Date, nullable=True)    # "Contract start date"
    contract_end_date = Column(Date, nullable=True)      # "Contract End Date"
    billing_method = Column(Integer, nullable=True)      # "Billing method (number of times)"
    high_potential_mark = Column(Boolean)
    record_timestamp = Column(TIMESTAMP, default=func.now())

# Create tables if they don't exist (or update your schema via migrations)
Base.metadata.create_all(bind=engine)

class ERPSalesRaw(Base):
    __tablename__ = "erp_sales_raw"
    id = Column(Integer, primary_key=True, autoincrement=True)
    upload_id = Column(Integer)
    job_no = Column(Integer)
    client_code = Column(String(50))
    client_name = Column(String(255))
    project_name = Column(String)
    sales_amount = Column(Numeric)
    operating_profit = Column(Numeric)
    sales_date = Column(Date)
    progress_status = Column(String(50))
    record_timestamp = Column(TIMESTAMP, default=func.now())

class CRMProjectFinal(Base):
    __tablename__ = "crm_projects_final"
    project_id = Column(Integer, primary_key=True)
    company_name = Column(String(255))
    department = Column(String(255))
    project_name = Column(String)
    phase = Column(String(50))
    status = Column(String(50))
    order_amount_net = Column(Numeric)
    contract_start_date = Column(Date)
    contract_end_date = Column(Date)
    billing_method = Column(Integer)
    high_potential_mark = Column(Boolean)
    last_updated = Column(TIMESTAMP, default=func.now(), onupdate=func.now())

class ERPSalesFinal(Base):
    __tablename__ = "erp_sales_final"
    job_no = Column(Integer, primary_key=True)
    client_code = Column(String(50))
    client_name = Column(String(255))
    project_name = Column(String)
    sales_amount = Column(Numeric)
    operating_profit = Column(Numeric)
    sales_date = Column(Date)
    progress_status = Column(String(50))
    last_updated = Column(TIMESTAMP, default=func.now(), onupdate=func.now())

class PerformanceReportGenerationHistory(Base):
    __tablename__ = "performance_report_generation_history"
    report_id = Column(Integer, primary_key=True, autoincrement=True)
    generated_timestamp = Column(TIMESTAMP, default=func.now())
    report_snapshot = Column(JSON)  # Save report data as JSON

# New table for DataCode Mapping (DataMap)
class DataCodeRaw(Base):
    __tablename__ = "data_code_raw"
    id = Column(Integer, primary_key=True, autoincrement=True)
    upload_id = Column(Integer)
    customer_name = Column(String(255))
    department_name = Column(String(255))
    parent_code = Column(String(255))
    project_name = Column(String)
    record_timestamp = Column(TIMESTAMP, default=func.now())

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

# ------------------------
# Pydantic Schemas
# ------------------------

# Existing schemas for CRM and ERP
class CRMProjectRawModel(BaseModel):
    project_id: int = Field(..., alias="No")
    status: Optional[str] = Field(None, alias="status")
    phase: Optional[str] = Field(None, alias="Phase")
    company_name: Optional[str] = Field(None, alias="Company Name")
    department: Optional[str] = Field(None, alias="Department Name")
    project_name: Optional[str] = Field(None, alias="Project name")
    project_manager: Optional[str] = Field(None, alias="Project Manager")
    pm: Optional[str] = Field(None, alias="PM")
    order_amount_gross: Optional[float] = Field(None, alias="Order amount (gross)")
    order_amount_net: Optional[float] = Field(None, alias="Order amount (net)")
    contract_start_date: Optional[str] = Field(None, alias="Contract start date")
    contract_end_date: Optional[str] = Field(None, alias="Contract End Date")
    billing_method: Optional[int] = Field(None, alias="Billing method (number of times)")
    unit: Optional[str] = Field(None, alias="unit")
    high_potential_mark: Optional[str] = Field(None, alias="high potential mark")

class CRMUploadPayload(BaseModel):
    file_name: str
    month: str
    records: List[CRMProjectRawModel]



class ERPSalesRawModel(BaseModel):
    job_no: str = Field(..., alias="JOB No.")
    salesperson_code: Optional[str] = Field(None, alias="Salesperson Code")
    sales_representative: Optional[str] = Field(None, alias="sales representative")
    person_in_charge_2: Optional[str] = Field(None, alias="Person in Charge 2")
    client_code: Optional[str] = Field(None, alias="Client Code")
    client_name: Optional[str] = Field(None, alias="Client name")
    project_name: Optional[str] = Field(None, alias="Project name")
    aggregation_category_code: Optional[str] = Field(None, alias="Aggregation Category Code")
    aggregation_category_name: Optional[str] = Field(None, alias="Aggregation Category Name")
    sales_posting_date: Optional[str] = Field(None, alias="Sales posting date")
    progress: Optional[str] = Field(None, alias="progress")
    sales_amount: Optional[float] = Field(None, alias="Sales amount")
    cost_1: Optional[float] = Field(None, alias="Cost 1")
    gross_profit: Optional[float] = Field(None, alias="Gross profit")
    gross_profit_margin: Optional[str] = Field(None, alias="Gross profit margin")
    cost_2: Optional[float] = Field(None, alias="Cost 2")
    gross_profit_alt: Optional[float] = Field(None, alias="Gross Profit")
    sales_rate: Optional[float] = Field(None, alias="Sales rate")
    cost_3: Optional[float] = Field(None, alias="Cost 3")
    operating_profit: Optional[float] = Field(None, alias="Operating profit")
    profit_rate: Optional[float] = Field(None, alias="Profit rate")
    total_cost: Optional[float] = Field(None, alias="Total Cost")
    project_code: Optional[str] = Field(None, alias="Project Code")
    project_name_1: Optional[str] = Field(None, alias="Project name_1")
    department_2nd: Optional[str] = Field(None, alias="Department (2nd level)")
    department_3rd: Optional[str] = Field(None, alias="Department (third level)")
    department_4th: Optional[str] = Field(None, alias="Department (4th hierarchical level)")
    department_5th: Optional[str] = Field(None, alias="Department (5th level)")
    department_6th: Optional[str] = Field(None, alias="Department (6th level)")
    customer_number: Optional[str] = Field(None, alias="Customer Number")
    customer: Optional[str] = Field(None, alias="Customer")
    billing_code: Optional[str] = Field(None, alias="Billing Code")
    billing_address: Optional[str] = Field(None, alias="Billing address")
    # Validators for numeric fields
    @validator(
        "sales_amount", "cost_1", "gross_profit", "cost_2", "gross_profit_alt",
        "sales_rate", "cost_3", "operating_profit", "profit_rate", "total_cost",
        pre=True, always=True
    )
    def validate_numeric_fields(cls, v):
        return parse_numeric(v)

def parse_numeric(value):
    if value is None:
        return None
    if isinstance(value, str):
        # Remove commas, spaces and percent signs (if present)
        value = value.strip().replace(",", "").replace("%", "")
    try:
        return float(value)
    except Exception as e:
        raise ValueError(f"Invalid numeric value: {value}. Error: {e}")


class ERPSalesUploadPayload(BaseModel):
    file_name: str
    month: str
    records: List[ERPSalesRawModel]


# New Pydantic schema for DataCode Mapping
class DataCodeMappingModel(BaseModel):
    customer_name: str = Field(..., alias="Customer Name")
    department_name: Optional[str] = Field(None, alias="Department Name")
    parent_code: Optional[str] = Field(None, alias="Parent Code")
    project_name: str = Field(..., alias="Project name")

class DataCodeUploadPayload(BaseModel):
    file_name: str
    month: str
    records: List[DataCodeMappingModel]

# ------------------------
# Dependency for DB Session
# ------------------------

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ------------------------
# FastAPI Application & Endpoints
# ------------------------

app = FastAPI(title="Data Upload & Reporting API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Adjust to your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/upload/crm")
def upload_crm(payload: CRMUploadPayload, db: Session = Depends(get_db)):
    # Create a new monthly upload record for CRM data
    new_upload = MonthlyUpload(upload_type="CRM", file_name=payload.file_name)
    db.add(new_upload)
    db.commit()
    db.refresh(new_upload)
    
    for rec in payload.records:
        # Convert high potential mark: assume "〇" means True; anything else is False.
        high_potential = True if rec.high_potential_mark and rec.high_potential_mark.strip() == "〇" else False

        # Parse contract start and end dates if provided (assumed format MM/DD/YY)
        contract_start = None
        if rec.contract_start_date:
            try:
                contract_start = datetime.datetime.strptime(rec.contract_start_date, "%m/%d/%y").date()
            except Exception:
                raise HTTPException(status_code=400, detail="Invalid Contract start date format. Expected MM/DD/YY.")
        contract_end = None
        if rec.contract_end_date:
            try:
                contract_end = datetime.datetime.strptime(rec.contract_end_date, "%m/%d/%y").date()
            except Exception:
                raise HTTPException(status_code=400, detail="Invalid Contract End Date format. Expected MM/DD/YY.")
        
        raw_record = CRMProjectRaw(
            upload_id=new_upload.upload_id,
            project_id=rec.project_id,
            status=rec.status,
            phase=rec.phase,
            company_name=rec.company_name,
            department=rec.department,
            project_name=rec.project_name,
            project_manager=rec.project_manager,
            pm=rec.pm,
            order_amount_gross=rec.order_amount_gross,
            order_amount_net=rec.order_amount_net,
            unit=rec.unit,
            contract_start_date=contract_start,
            contract_end_date=contract_end,
            billing_method=rec.billing_method,
            high_potential_mark=high_potential
        )
        db.add(raw_record)
    db.commit()
    return {"message": "CRM data uploaded successfully", "upload_id": new_upload.upload_id}



# Endpoint: Upload ERP Sales Raw Data
@app.post("/api/upload/erp/sales")
def upload_erp_sales(payload: ERPSalesUploadPayload, db: Session = Depends(get_db)):
    new_upload = MonthlyUpload(upload_type="ERP_Sales", file_name=payload.file_name)
    db.add(new_upload)
    db.commit()
    db.refresh(new_upload)
    
    for rec in payload.records:
        # Convert job_no from string to int
        try:
            job_no_int = int(rec.job_no)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid job_no format: {rec.job_no}. Error: {e}")
        
        # Parse sales posting date (expected format: YY/MM/DD, e.g., "24/04/30")
        sales_date = None
        if rec.sales_posting_date:
            try:
                sales_date = datetime.datetime.strptime(rec.sales_posting_date.strip(), "%y/%m/%d").date()
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Invalid Sales posting date format: {rec.sales_posting_date}. Expected YY/MM/DD. Error: {e}")
        
        raw_record = ERPSalesRaw(
            upload_id=new_upload.upload_id,
            job_no=job_no_int,
            client_code=rec.client_code,
            client_name=rec.client_name,
            project_name=rec.project_name,
            sales_amount=rec.sales_amount,
            operating_profit=rec.operating_profit,
            sales_date=sales_date,
            progress_status=rec.progress
        )
        # You can also store additional fields if your ERP table/model is extended accordingly.
        db.add(raw_record)
    
    db.commit()
    return {"message": "ERP Sales data uploaded successfully", "upload_id": new_upload.upload_id}


# Endpoint: Upload DataCode Mapping
@app.post("/api/upload/datacode")
def upload_datacode(payload: DataCodeUploadPayload, db: Session = Depends(get_db)):
    new_upload = MonthlyUpload(upload_type="DataCode", file_name=payload.file_name)
    db.add(new_upload)
    db.commit()
    db.refresh(new_upload)

    for rec in payload.records:
        raw_record = DataCodeRaw(
            upload_id=new_upload.upload_id, 
            customer_name=rec.customer_name,
            department_name=rec.department_name,
            parent_code=rec.parent_code,
            project_name=rec.project_name
        )
        db.add(raw_record)
    db.commit()

    return {"message": "DataCode Mapping data uploaded successfully", "upload_id": new_upload.upload_id}

# Endpoint: Consolidate Raw Data into Final Tables
@app.post("/api/consolidate")
def consolidate_data(db: Session = Depends(get_db)):
    # Consolidate CRM data
    crm_records = db.query(CRMProjectRaw).all()
    for rec in crm_records:
        final = db.query(CRMProjectFinal).filter(CRMProjectFinal.project_id == rec.project_id).first()
        if final:
            final.company_name = rec.company_name
            final.department = rec.department
            final.project_name = rec.project_name
            final.phase = rec.phase
            final.status = rec.status
            final.order_amount_net = rec.order_amount_net
            final.contract_start_date = rec.contract_start_date
            final.contract_end_date = rec.contract_end_date
            final.billing_method = rec.billing_method
            final.high_potential_mark = rec.high_potential_mark
        else:
            final = CRMProjectFinal(
                project_id=rec.project_id,
                company_name=rec.company_name,
                department=rec.department,
                project_name=rec.project_name,
                phase=rec.phase,
                status=rec.status,
                order_amount_net=rec.order_amount_net,
                contract_start_date=rec.contract_start_date,
                contract_end_date=rec.contract_end_date,
                billing_method=rec.billing_method,
                high_potential_mark=rec.high_potential_mark
            )
            db.add(final)
    
    # Consolidate ERP Sales data
    erp_records = db.query(ERPSalesRaw).all()
    for rec in erp_records:
        final = db.query(ERPSalesFinal).filter(ERPSalesFinal.job_no == rec.job_no).first()
        if final:
            final.client_code = rec.client_code
            final.client_name = rec.client_name
            final.project_name = rec.project_name
            final.sales_amount = rec.sales_amount
            final.operating_profit = rec.operating_profit
            final.sales_date = rec.sales_date
            final.progress_status = rec.progress_status
        else:
            final = ERPSalesFinal(
                job_no=rec.job_no,
                client_code=rec.client_code,
                client_name=rec.client_name,
                project_name=rec.project_name,
                sales_amount=rec.sales_amount,
                operating_profit=rec.operating_profit,
                sales_date=rec.sales_date,
                progress_status=rec.progress_status
            )
            db.add(final)
    
    db.commit()
    return {"message": "Data consolidation completed"}

def calculate_monthly_net_sales(order_amount, billing_method, start_date, end_date):
    """
    Distribute the order amount over the contract period.
    """
    if not order_amount or not start_date or not end_date:
        return {}
    try:
        start_date = datetime.strptime(start_date, "%Y-%m-%d %H:%M:%S")
        end_date = datetime.strptime(end_date, "%Y-%m-%d %H:%M:%S")
        delta_months = (end_date.year - start_date.year) * 12 + (end_date.month - start_date.month) + 1
        if delta_months <= 0:
            return {}
        billing_method = int(billing_method) if billing_method and int(billing_method) > 0 else delta_months
        billing_method = min(billing_method, delta_months)
        monthly_net_sales = order_amount / billing_method
        monthly_sales = {}
        current_date = start_date
        for _ in range(billing_method):
            month_key = current_date.strftime("%B")
            monthly_sales[month_key] = monthly_net_sales
            current_date += relativedelta(months=1)
        return monthly_sales
    except Exception as e:
        print(f"Error calculating monthly net sales: {e}")
        return {}


def extract_project_rank(phase: str) -> str:
    """
    Extracts the project rank from the phase string.
    If the phase starts with "SA", returns "SA".
    Otherwise, returns the first character (if in A-F) or defaults to "E".
    """
    if not phase:
        return "E"
    phase = phase.strip().upper()
    if phase.startswith("SA"):
        print(f"Phase '{phase}' identified as 'SA'.")
        return "SA"
    # Otherwise, take the first character
    rank = phase[0]
    if rank in "ABCDEFSA":
        print(f"Phase '{phase}' extracted rank: '{rank}'.")
        return rank
    print(f"Phase '{phase}' did not match known ranks, defaulting to 'E'.")
    return "E"


def create_performance_report(zac_data, datacode_data, kintone_data):
    performance_report = {}
    print(zac_data, datacode_data, kintone_data)
    # Build mapping from CRM final data: project_name -> phase (default "E")
    phase_project_rank_mapping = {}
    for item in kintone_data:
        pname = item.get("project_name")
        phase = item.get("phase", "E")
        # Use our helper to extract rank from the phase string
        phase_project_rank_mapping[pname] = extract_project_rank(phase)
        print(f"CRM: For project '{pname}', phase '{phase}' -> rank '{phase_project_rank_mapping[pname]}'.")

    # Process ERP (zac) data
    for item in zac_data:
        project_name = item.get("project_name")
        job_no = item.get("job_no")
        if not job_no or not str(job_no).strip():
            print(f"Skipping ERP record with empty job_no for project '{project_name}'.")
            continue
        try:
            project_code = f"{int(job_no):07d}"
        except Exception as e:
            print(f"Error converting job_no '{job_no}' to project code: {e}")
            continue

        if project_code not in performance_report:
            parent_code = ""
            for x in datacode_data:
                if x.get("project_name") == project_name:
                    parent_code = x.get("parent_code", "")
                    break
            performance_report[project_code] = {
                "Parent Code": parent_code,
                "Customer Name": item.get("client_name", ""),
                "Project Name": project_name,
                "Project Rank": phase_project_rank_mapping.get(project_name, "E"),
                "Project Code": project_code,
                "April": 0,
                "May": 0,
                "June": 0,
                "July": 0,
                "August": 0,
                "September": 0,
                "October": 0,
                "November": 0,
                "December": 0,
                "January": 0,
                "February": 0,
                "March": 0,
                "Net sales amount": 0
            }
            print(f"Created report entry for ERP project '{project_name}' with code '{project_code}'.")

        sales_date = item.get("sales_date")
        if sales_date:
            try:
                if isinstance(sales_date, datetime):
                    sales_date_str = sales_date.strftime("%Y-%m-%d 00:00:00")
                else:
                    sales_date_str = sales_date
                sales_date_dt = datetime.strptime(sales_date_str, "%Y-%m-%d %H:%M:%S")
                month_key = sales_date_dt.strftime("%B")
                op = float(item.get("operating_profit") or 0)
                performance_report[project_code][month_key] += op
                performance_report[project_code]["Net sales amount"] += op
                print(f"Added operating profit {op} for {month_key} to ERP project '{project_name}' (code: {project_code}).")
            except Exception as e:
                print(f"Error processing sales date for ERP project '{project_name}': {e}")

    # Process CRM (kintone) final data
    for item in kintone_data:
        project_name = item.get("project_name")
        try:
            project_code = f"{int(item.get('project_id')):07d}"
        except Exception as e:
            print(f"Error converting CRM project id for '{project_name}': {e}")
            continue
        # Here high_potential_mark is now boolean
        high_potential_mark = item.get("high_potential_mark")
        phase = item.get("phase")
        project_rank = extract_project_rank(phase) if phase else "E"
        print(f"CRM: Project '{project_name}', high potential: {high_potential_mark}, rank: {project_rank}")
        # Now check using boolean: if high potential is True and rank in B-F, or rank is A
        if (high_potential_mark is True and project_rank in ["B", "C", "D", "E", "F"]) or project_rank == "A":
            if project_code not in performance_report:
                parent_code = ""
                for x in datacode_data:
                    if x.get("project_name") == project_name:
                        parent_code = x.get("parent_code", "")
                        break
                performance_report[project_code] = {
                    "Parent Code": parent_code,
                    "Customer Name": item.get("company_name", ""),
                    "Project Name": project_name,
                    "Project Rank": project_rank,
                    "Project Code": project_code,
                    "April": 0,
                    "May": 0,
                    "June": 0,
                    "July": 0,
                    "August": 0,
                    "September": 0,
                    "October": 0,
                    "November": 0,
                    "December": 0,
                    "January": 0,
                    "February": 0,
                    "March": 0,
                    "Net sales amount": 0
                }
                print(f"Created report entry for CRM project '{project_name}' with code '{project_code}'.")
            try:
                order_amount = (float(item.get("order_amount_net") or 0)) * 1000000
                billing_method = item.get("billing_method")
                cs = item.get("contract_start_date")
                ce = item.get("contract_end_date")
                if cs and ce:
                    cs_str = cs.strftime("%Y-%m-%d 00:00:00") if isinstance(cs, datetime) else cs
                    ce_str = ce.strftime("%Y-%m-%d 00:00:00") if isinstance(ce, datetime) else ce
                    monthly_sales = calculate_monthly_net_sales(order_amount, billing_method, cs_str, ce_str)
                    print(f"For CRM project '{project_name}', monthly sales calculated: {monthly_sales}")
                    for month, amount in monthly_sales.items():
                        performance_report[project_code][month] += amount
                        performance_report[project_code]["Net sales amount"] += amount
                else:
                    print(f"CRM project '{project_name}' missing contract dates.")
            except Exception as e:
                print(f"Error calculating monthly sales for CRM project '{project_name}': {e}")

    print(f"Final performance report: {performance_report}")
    return list(performance_report.values())


# ------------------------
# Performance Report Endpoint
# ------------------------

@app.post("/api/generate_report")
def generate_performance_report_endpoint(db: Session = Depends(get_db)):
    # Query the latest final data
    zac_data = [item.__dict__ for item in db.query(ERPSalesFinal).all()]
    datacode_data = [item.__dict__ for item in db.query(DataCodeRaw).all()]
    kintone_data = [item.__dict__ for item in db.query(CRMProjectFinal).all()]

    # Remove SQLAlchemy internal state if exists
    for lst in (zac_data, datacode_data, kintone_data):
        for d in lst:
            d.pop("_sa_instance_state", None)

    # Generate the performance report using our helper function
    report = create_performance_report(zac_data, datacode_data, kintone_data)

    # Save the report snapshot along with the generated timestamp
    new_report = PerformanceReportGenerationHistory(report_snapshot=report)
    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    return {
        "message": "Performance report generated and saved successfully",
        "report": report,
        "report_id": new_report.report_id,
        "generated_on": new_report.generated_timestamp.isoformat()
    }


# Optional: Health check endpoint
@app.get("/api/health")
def health_check():
    return {"status": "ok"}



