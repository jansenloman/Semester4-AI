import os
if not os.path.exists("./storage"):
    os.mkdir("./storage")
else:
    for file in os.listdir("./storage"):
        os.unlink("./storage/" + file)
if os.path.exists("./backend.db"):
    os.unlink("./backend.db")
if os.path.exists("./sessions"):
    os.unlink("./sessions")