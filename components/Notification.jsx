import { AiOutlineCheckCircle, AiOutlineCloseCircle } from "react-icons/ai";

const Notification = ({ type, message }) => {
  const styles = {
    success: {
      bg: "bg-green-500",
      icon: <AiOutlineCheckCircle className="text-xl" />,
    },
    error: {
      bg: "bg-red-500",
      icon: <AiOutlineCloseCircle className="text-xl" />,
    },
  };

  return (
    <div
      className={`fixed top-4 right-4 ${styles[type].bg} text-white px-4 py-2 rounded shadow-lg flex items-center space-x-2 animate-fade-in z-50`}
    >
      {styles[type].icon}
      <span>{message}</span>
    </div>
  );
};

export default Notification; 