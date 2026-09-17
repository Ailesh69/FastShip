from fastapi.security import OAuth2PasswordBearer

# tokenUrl must match the actual token route (used by the /docs "Authorize" dialog).
OAuth2_scheme_seller = OAuth2PasswordBearer(tokenUrl="/seller/token", scheme_name="Seller")
OAuth2_scheme_DP = OAuth2PasswordBearer(tokenUrl="/partner/token", scheme_name="DeliveryPartner")
OAuth2_scheme_client = OAuth2PasswordBearer(tokenUrl="/client/token", scheme_name="Client")
