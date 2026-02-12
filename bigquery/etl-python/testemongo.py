from pymongo import MongoClient

uri = "mongodb://admin:hnjQ9LChw773iMNmFCjLuSGBZd00gKeBY7f1fke4O@207.244.249.157:27017/bigquery?authSource=admin"

client = MongoClient(uri)

db = client["bigquery"]

print(db.list_collection_names())
