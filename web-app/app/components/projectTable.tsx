"use client";
import { deleteProject, addParticipantToProject } from "./action";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/react";
import { useState } from "react";

type ProjectWithImage = {
  userId: string;
  title: string;
  createdAt: Date;
  id: string;
  status: string;
  imageUrl?: string; // Add the missing property
};

type ProjectDetailsArray = ProjectWithImage[];

// Utility function to get status badge details
const getStatusBadge = (status: string) => {
  switch (status) {
    case "IN_PROGRESS":
      return {
        text: "Processing...",
        color: "bg-yellow-200",
        dot: "bg-yellow-800",
        animate: "animate-pulse",
        text_color: "text-black",
      };
    case "NOT_STARTED":
      return { text: "Not Started", color: "bg-gray-500", dot: "bg-gray-700" };
    case "FAILED":
      return { text: "Failed", color: "bg-red-500", dot: "bg-red-800" };
    case "COMPLETED":
      return { text: "Completed", color: "bg-green-500", dot: "bg-green-800" };
    default:
      return { text: "Unknown", color: "bg-gray-500", dot: "bg-gray-700" };
  }
};

export default function App({
  projectDetails,
}: {
  projectDetails: ProjectDetailsArray;
}) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inviteeEmail, setInviteeEmail] = useState("");
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  const handleInviteClick = (projectId: string) => {
    setCurrentProjectId(projectId);
    setIsModalOpen(true);
  };

  const handleInviteSubmit = async () => {
    if (!currentProjectId || !inviteeEmail) return;

    // Add your invitation logic here
    console.log(`Inviting ${inviteeEmail} to project ${currentProjectId}`);
    const result = await addParticipantToProject({
      projectId: currentProjectId,
      emailId: inviteeEmail,
    });
    if (result) {
      alert("Invitation sent successfully");
    }
    if (!result) {
      alert("either use does not exist or already invited");
    }

    // Close the modal after submission
    setIsModalOpen(false);
    setInviteeEmail("");
    setCurrentProjectId(null);
  };

  return (
    <>
      <Table
        isStriped
        aria-label="Project details table"
        className="border bg-[#eceae0] rounded-2xl shadow-lg"
      >
        <TableHeader>
          <TableColumn className="text-left px-6 py-4 font-semibold text-gray-700">
            Thumbnail
          </TableColumn>
          <TableColumn className="text-left px-6 py-4 font-semibold text-gray-700">
            Project Name
          </TableColumn>
          <TableColumn className="text-left px-6 py-4 font-semibold text-gray-700">
            Created At
          </TableColumn>
          <TableColumn className="text-left px-6 py-4 font-semibold text-gray-700">
            Status
          </TableColumn>
          <TableColumn className="text-left px-6 py-4 font-semibold text-gray-700">
            Actions
          </TableColumn>
          <TableColumn className="text-left px-6 py-4 font-semibold text-gray-700">
            Invitations
          </TableColumn>
        </TableHeader>
        <TableBody>
          {projectDetails.length > 0 ? (
            projectDetails.map((project) => {
              const { text, color, dot, animate, text_color } = getStatusBadge(
                project.status
              );
              return (
                <TableRow
                  key={project.id}
                  className="bg-[#f9f8f4] hover:bg-[#fafbf8] transition duration-200 h-24"
                >
                  <TableCell className="text-left pl-6 py-4 relative overflow-visible">
                    <div className="relative w-32 h-32">
                      <Image
                        src={project.imageUrl!}
                        width={200}
                        height={200}
                        alt="project preview"
                        className="w-full h-full rounded-md transition-transform duration-300 transform hover:scale-150 absolute"
                      />
                    </div>
                  </TableCell>
                  <TableCell
                    className="text-left pr-6 py-4 cursor-pointer font-medium text-gray-900 hover:text-blue-600 hover:underline"
                    onClick={() => {
                      if (project.status === "NOT_STARTED") {
                        router.push(`/build-project/${project.id}`);
                        return;
                      }
                      router.push(
                        `/view-project/${project.userId}/${project.id}`
                      );
                    }}
                  >
                    {project.title}
                  </TableCell>
                  <TableCell className="text-left px-6 py-4 text-gray-700">
                    {project.createdAt.toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-left px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${color} ${animate} ${
                        text_color ? text_color : "text-white"
                      }`}
                    >
                      <div className={`h-2 w-2 rounded-full ${dot}`}></div>
                      {text}
                    </span>
                  </TableCell>
                  <TableCell className="text-left px-6 py-4">
                    <button
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition duration-200"
                      onClick={async () => {
                        try {
                          await deleteProject({
                            userId: project.userId,
                            projectId: project.id,
                          });
                          window.location.reload();
                        } catch (error) {
                          console.error(error);
                        }
                      }}
                    >
                      Delete Project
                    </button>
                  </TableCell>
                  <TableCell className="text-left px-6 py-4">
                    <button
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 transition duration-200"
                      onClick={() => handleInviteClick(project.id)}
                    >
                      Invitations
                    </button>
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell
                className="text-center px-6 py-4 text-gray-700"
                colSpan={5}
              >
                <div className="flex flex-col items-center justify-center py-10">
                  <span className="text-xl font-semibold">
                    No projects available
                  </span>
                  <span className="text-sm text-gray-500">
                    Create a new project to get started
                  </span>
                </div>
              </TableCell>
              <TableCell>&nbsp;</TableCell>
              <TableCell>&nbsp;</TableCell>
              <TableCell>&nbsp;</TableCell>
              <TableCell>&nbsp;</TableCell>
              <TableCell>&nbsp;</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Modal for Invitations */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-[#eceae0] p-6 h-[300px] w-[400px] rounded-lg shadow-lg flex flex-col justify-between">
            {/* Modal Header */}
            <h2 className="text-xl font-semibold mb-4">Invite User</h2>

            {/* Input for Invitee's Email */}
            <input
              type="email"
              placeholder="Enter invitee's email"
              className="w-full p-2 border border-gray-300 rounded-lg mb-4"
              value={inviteeEmail}
              onChange={(e) => setInviteeEmail(e.target.value)}
            />

            {/* Buttons at the Bottom */}
            <div className="flex justify-between">
              <button
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition duration-200"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200"
                onClick={handleInviteSubmit}
              >
                Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
