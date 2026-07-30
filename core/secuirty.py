from fastapi.security import OAuth2PasswordBearer

OAuth2_scheme_seller = OAuth2PasswordBearer(tokenUrl="/seller/login", scheme_name="Seller")
OAuth2_scheme_DP = OAuth2PasswordBearer(tokenUrl="/partner/login", scheme_name="DeliveryPartner")
OAuth2_scheme_client = OAuth2PasswordBearer(tokenUrl="/client/token", scheme_name="Client")
