interface CardProps {
    infoName: string;
    value: string;
}

const Info = ({ infoName, value }: CardProps) => {
    return (
        <div className="flex flex-col px-10 py-2 border border-gray-300 rounded-2xl bg-gray-200 ">
            <span className="mt-1 text-center">{infoName}</span>
            <span className="mt-1 text-center">{value}</span>
        </div>
    );
}

export default Info;