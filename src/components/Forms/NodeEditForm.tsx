import { useState } from "react";

interface NodeEditFormProps {
  data: any;
  onUpdate: (data: any) => void;
  onClose: () => void;
  nodeType: string;
}

const NodeEditForm = ({ data, onUpdate, onClose, nodeType }: NodeEditFormProps) => {
  const [formData, setFormData] = useState(data);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
    onClose();
  };

  // Get node type title
  const getTitle = () => {
    const titles: Record<string, string> = {
      trafficSource: "Traffic Source",
      campaign: "Campaign",
      adSet: "Ad Set",
      ad: "Ad",
      audience: "Audience",
      result: "Result",
    };
    return titles[nodeType] || "Node";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-full">
        <h2 className="text-xl font-bold mb-4">Edit {getTitle()}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Label</label>
            <input
              type="text"
              value={formData.label || ""}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>

          {/* Dynamic fields based on node type */}
          {Object.keys(formData).map((key) => {
            if (key === "label") return null;
            return (
              <div key={key} className="mb-4">
                <label className="block text-sm font-medium mb-1 capitalize">
                  {key.replace(/([A-Z])/g, " $1").trim()}
                </label>
                <input
                  type="text"
                  value={formData[key] || ""}
                  onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            );
          })}

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NodeEditForm;
