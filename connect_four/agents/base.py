from abc import ABC, abstractmethod

class BaseAgent(ABC):
    """
    Abstract Base class for all Connect Four agents.
    """
    @abstractmethod
    def get_move(self, engine):
        """
        Given the current ConnectFourEngine state, returns a legal column index (0-6).
        """
        pass
