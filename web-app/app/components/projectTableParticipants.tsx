"use client";
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

type ProjectWithImage = {
  userId: string;
  title: string;
  createdAt: Date;
  id: string;
  status: string;
  imageUrl?: string; // Add the missing property
};

type ProjectDetailsArray = ProjectWithImage[];

export default function App({
  projectDetails,
}: {
  projectDetails: ProjectDetailsArray;
}) {
  const router = useRouter();

  return (
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
      </TableHeader>
      <TableBody>
        {projectDetails.length > 0 ? (
          projectDetails.map((project) => {
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
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
