from fastapi.security import OAuth2PasswordBearer

# tokenUrl must name the route that actually issues the token — it is what the
# /docs "Authorize" dialog posts credentials to. Seller and partner both pointed
# at "/login", which no router defines (they are "/token", like the client's),
# so authorizing from the docs 404'd and every protected endpoint there stayed
# unusable.
OAuth2_scheme_seller = OAuth2PasswordBearer(tokenUrl="/seller/token", scheme_name="Seller")
OAuth2_scheme_DP = OAuth2PasswordBearer(tokenUrl="/partner/token", scheme_name="DeliveryPartner")
OAuth2_scheme_client = OAuth2PasswordBearer(tokenUrl="/client/token", scheme_name="Client")
