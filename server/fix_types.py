import os

files = [
    'accountController.ts', 'aiController.ts', 'analyticsController.ts', 'billController.ts', 'budgetController.ts',
    'goalController.ts', 'importController.ts', 'notificationController.ts', 'receiptController.ts', 'reportController.ts'
]

base = r'c:\Users\ASUS\Desktop\Projects\SpendSage\server\src\controllers'

for f in files:
    path = os.path.join(base, f)
    with open(path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    if "import { Request, Response } from 'express';" not in content:
        content = "import { Request, Response } from 'express';\n" + content
    
    content = content.replace("async (req, res)", "async (req: Request, res: Response)")
    
    with open(path, 'w', encoding='utf-8') as file:
        file.write(content)

print("Fixed typings.")
