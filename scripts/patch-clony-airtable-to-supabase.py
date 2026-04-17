#!/usr/bin/env python3
"""
Patch Clony AI workflow: replace 8 Airtable nodes with Supabase nodes.
Also fixes text2 downstream reference (fields["Description"] -> description).

Input:  /tmp/clony_workflow_full.json  (from enhanced-n8n get_workflow)
Output: /tmp/clony_workflow_patched.json (ready for update_workflow)
"""
import json
import copy
import sys

SUPABASE_CRED = {"supabaseApi": {"id": "BEN5whZYhAl6vroY", "name": "Clony AI"}}

# Airtable field name -> Supabase snake_case column name
FIELD_MAP = {
    "Title": "title",
    "Status": "status",
    "record": "record",
    "Product_url": "product_url",
    "Main image": "main_image",
    "MAIN AI DESIGN": "main_ai_design",
    "AI DESIGN": "ai_design",
    "Original Image": "original_images",
    "Articul": "articul",
    "Description": "description",
    "optionsText": "options_text",
    "brand": "brand",
    "Сколько фото оригинал": "original_photo_count",
    "PDF": "pdf",
    "GOOGLE DOC": "google_doc",
    "Открыть Дизайн": "open_design",
    "Открыть Сайт Товара": "open_product_site",
    "Slide2": "slide2",
    "Slide3": "slide3",
    "Slide4": "slide4",
    "Slide5": "slide5",
    "Slide6": "slide6",
    "Slide7": "slide7",
    "Slide8": "slide8",
    "Slide9": "slide9",
    "Design Date": "design_date",
    "Prompt": "prompt",
    "cloudinary": "cloudinary",
    "cloudinary links": "cloudinary_links",
    "Size Ratio": "size_ratio",
    "Language": "language",
    "Style": "style",
    "Color": "color",
    "run history": "run_history",
    "Slides": "slides",
    "Users": "users",
    "Requests": "requests",
    "website screenshot": "website_screenshot",
    "video": "video",
    "marketing": "marketing",
    # Requests table
    "Request_id": "request_id",
    "Date": "date",
    "Designs": "designs",
    "Request Text": "request_text",
    "Name": "name",
    "Input_type": "input_type",
    "Attachments": "attachments",
    "Audio": "audio",
    "Transcribe": "transcribe",
    "Clony_session_id": "clony_session_id",
    "Record_id": "record_id",
    "Log_automation": "log_automation",
    "Excution_id": "execution_id",
}

# Fields that were Airtable attachment arrays [{url:...}] and should become
# plain URL strings in Supabase (single-URL fields)
ATTACHMENT_SINGLE_FIELDS = {"main_image", "website_screenshot", "video"}
# Fields that were attachment arrays and should become jsonb arrays
ATTACHMENT_MULTI_FIELDS = {"original_images"}


def transform_value(field_name_supabase, airtable_expr):
    """Transform an Airtable field value expression for Supabase."""
    expr = airtable_expr

    # For "Main image" -> "main_image": Airtable sometimes stores [{url:...}]
    # but the actual expressions in this workflow already use plain URL strings
    # or explicit [{url:...}] wrappers. We need to strip the wrapper for Supabase.

    if field_name_supabase in ATTACHMENT_SINGLE_FIELDS:
        # Strip [{ "url": ... }] wrapper if present
        # Pattern: ={{ [{ "url": <inner> }] }}
        # or: ={{ [{url: <inner>}] }}
        import re
        m = re.match(
            r'^=\{\{\s*\[\s*\{\s*"?url"?\s*:\s*(.+?)\s*\}\s*\]\s*\}\}$',
            expr.strip(),
        )
        if m:
            inner = m.group(1).strip()
            return f"={{{{ {inner} }}}}"

    if field_name_supabase in ATTACHMENT_MULTI_FIELDS:
        # Strip .map(url => ({ "url": url })) wrapper for jsonb column
        import re
        m = re.match(
            r'^(=\{\{.+?)\.map\(\s*url\s*=>\s*\(\s*\{\s*"url"\s*:\s*url\s*\}\s*\)\s*\)(\s*\}\})$',
            expr.strip(),
        )
        if m:
            return m.group(1) + m.group(2)

    return expr


def make_supabase_create_node(airtable_node, table_id):
    """Convert an Airtable create node to a Supabase create node."""
    cols = airtable_node["parameters"].get("columns", {}).get("value", {})

    field_values = []
    for airtable_field, expr in cols.items():
        supabase_col = FIELD_MAP.get(airtable_field, airtable_field.lower().replace(" ", "_"))
        transformed = transform_value(supabase_col, expr)
        field_values.append({"fieldId": supabase_col, "fieldValue": transformed})

    return {
        "id": airtable_node["id"],
        "name": airtable_node["name"],
        "type": "n8n-nodes-base.supabase",
        "typeVersion": 1,
        "position": airtable_node["position"],
        "credentials": SUPABASE_CRED,
        "parameters": {
            "operation": "create",
            "tableId": table_id,
            "fieldsUi": {"fieldValues": field_values},
        },
    }


def make_supabase_update_node(airtable_node, table_id):
    """Convert an Airtable update node to a Supabase update node."""
    cols = airtable_node["parameters"].get("columns", {}).get("value", {})

    # The "id" field is used as the match key
    id_expr = cols.get("id", "")

    field_values = []
    for airtable_field, expr in cols.items():
        if airtable_field == "id":
            continue  # id goes into the filter, not the update values
        supabase_col = FIELD_MAP.get(airtable_field, airtable_field.lower().replace(" ", "_"))
        transformed = transform_value(supabase_col, expr)
        field_values.append({"fieldId": supabase_col, "fieldValue": transformed})

    return {
        "id": airtable_node["id"],
        "name": airtable_node["name"],
        "type": "n8n-nodes-base.supabase",
        "typeVersion": 1,
        "position": airtable_node["position"],
        "credentials": SUPABASE_CRED,
        "parameters": {
            "operation": "update",
            "tableId": table_id,
            "filterType": "string",
            "filterString": f"id=eq.{id_expr}" if not id_expr.startswith("=") else "=id=eq." + id_expr[1:],
            "fieldsUi": {"fieldValues": field_values},
        },
    }


def fix_text2_node(node):
    """Fix text2 Set node: $node["record instagram"].json["fields"]["Description"]
    -> $node["record instagram"].json["description"]"""
    new_node = copy.deepcopy(node)
    assignments = new_node["parameters"].get("assignments", {}).get("assignments", [])
    for a in assignments:
        if "fields" in a.get("value", "") and "Description" in a.get("value", ""):
            a["value"] = a["value"].replace(
                '$node["record instagram"].json["fields"]["Description"]',
                '$node["record instagram"].json["description"]',
            )
            # Also handle $item("0").$node variant
            a["value"] = a["value"].replace(
                '$item("0").$node["record instagram"].json["fields"]["Description"]',
                '$item("0").$node["record instagram"].json["description"]',
            )
    return new_node


# Map of Airtable node name -> (table name, operation type)
NODE_TABLE_MAP = {
    "Create a record1": ("clony_designs", "create"),
    "Create a record2": ("clony_designs", "create"),
    "Create a record3": ("clony_designs", "create"),
    "Create a record4": ("clony_designs", "create"),
    "Create a record7": ("clony_designs", "create"),
    "record instagram": ("clony_designs", "create"),
    "Update record1": ("clony_designs", "update"),
    "request": ("clony_requests", "create"),
}


def main():
    with open("/tmp/clony_workflow_full.json") as f:
        wf = json.load(f)

    data = wf["data"]
    nodes = data["nodes"]
    patched_count = 0

    new_nodes = []
    for node in nodes:
        name = node["name"]

        # Patch Airtable nodes
        if name in NODE_TABLE_MAP:
            table_id, op = NODE_TABLE_MAP[name]
            if op == "create":
                new_node = make_supabase_create_node(node, table_id)
            else:
                new_node = make_supabase_update_node(node, table_id)
            new_nodes.append(new_node)
            patched_count += 1
            print(f"  PATCHED: {name} -> supabase {op} on {table_id}")

        # Fix text2 downstream reference
        elif name == "text2":
            new_node = fix_text2_node(node)
            new_nodes.append(new_node)
            print(f"  FIXED:   text2 (removed fields[] wrapper)")

        else:
            new_nodes.append(node)

    data["nodes"] = new_nodes

    # Verify
    airtable_remaining = [n for n in new_nodes if "airtable" in n.get("type", "").lower()]
    supabase_new = [n for n in new_nodes if "supabase" in n.get("type", "").lower()]
    print(f"\nResult: {patched_count} nodes patched")
    print(f"  Airtable nodes remaining: {len(airtable_remaining)}")
    print(f"  Supabase nodes total: {len(supabase_new)}")

    # Output only nodes and connections for update_workflow
    output = {
        "nodes": data["nodes"],
        "connections": data["connections"],
    }

    with open("/tmp/clony_workflow_patched.json", "w") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    print(f"\nSaved to /tmp/clony_workflow_patched.json")
    print(f"Total nodes: {len(data['nodes'])}")


if __name__ == "__main__":
    main()
